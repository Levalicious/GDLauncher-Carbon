use std::{
    collections::{HashMap, VecDeque},
    path::{Path, PathBuf},
    sync::Arc,
};

use anyhow::Context;
use async_zip::{tokio::write::ZipFileWriter, Compression, ZipDateTime, ZipEntryBuilder};

use glob::Pattern as GlobPattern;
use serde::{Deserialize, Serialize};
use strum_macros::EnumIter;
use tokio::io::AsyncReadExt;

use crate::{
    domain::{
        instance::{info::ModLoaderType, InstanceId},
        runtime_path::InstancePath,
        vtask::VisualTaskId,
    },
    managers::{minecraft::absolute_clean_path, AppInner},
};

pub mod curseforge;
pub mod modrinth;

#[derive(Debug, Serialize, Deserialize, EnumIter)]
pub enum ExportFormat {
    CurseForgeZip,
    MRPack,
}

impl ExportFormat {
    pub fn get_available() -> Vec<Self> {
        use strum::IntoEnumIterator;
        Self::iter().collect()
    }
}

static PRIMARY_LOADER_TYPES: [ModLoaderType; 3] = [
    ModLoaderType::Forge,
    ModLoaderType::Fabric,
    ModLoaderType::Quilt,
];

#[async_trait::async_trait]
pub trait InstanceExporter {
    async fn export<F: Fn(&Path) -> bool + Send>(
        &self,
        app: Arc<AppInner>,
        instance_id: InstanceId,
        output_path: PathBuf,
        filter: F,
    ) -> anyhow::Result<VisualTaskId>;
}

pub struct ArchiveExporter {
    output_path: PathBuf,
    input_dir: PathBuf,
    files: Vec<PathBuf>,
    follow_symlinks: bool,
    exclude_patterns: Vec<GlobPattern>,
    extra_files: HashMap<String, Vec<u8>>,
    directory_prefix: String,
}

impl ArchiveExporter {
    pub fn new(
        output_path: PathBuf,
        input_dir: PathBuf,
        files: Vec<PathBuf>,
        directory_prefix: String,
        follow_symlinks: bool,
    ) -> Self {
        Self {
            output_path,
            input_dir,
            files,
            follow_symlinks,
            exclude_patterns: Vec::new(),
            extra_files: HashMap::new(),
            directory_prefix,
        }
    }

    pub fn add_exclude_patterns<'a, I>(&mut self, patterns: I) -> anyhow::Result<()>
    where
        I: IntoIterator<Item = &'a str>,
    {
        self.exclude_patterns.extend(
            patterns
                .into_iter()
                .map(GlobPattern::new)
                .collect::<Result<Vec<GlobPattern>, _>>()?,
        );
        Ok(())
    }

    pub fn add_extra_file(&mut self, file_name: String, data: Vec<u8>) -> bool {
        self.extra_files.insert(file_name, data).is_some()
    }

    pub async fn export(&self) -> anyhow::Result<()> {
        if tokio::fs::try_exists(&self.input_dir).await? {
            return Err(anyhow::anyhow!("Input directory does not exist"));
        }

        let input_dir = absolute_clean_path(&self.input_dir)?;

        let mut out_file = tokio::fs::File::create(&self.output_path)
            .await
            .with_context(|| {
                format!(
                    "Error opening file {} for writing",
                    &self.output_path.to_string_lossy()
                )
            })?;
        let mut archive = ZipFileWriter::with_tokio(&mut out_file);

        for (file_name, data) in &self.extra_files {
            let entry = ZipEntryBuilder::new(file_name.clone().into(), Compression::Deflate);
            archive.write_entry_whole(entry, data).await?;
        }

        for input_file in &self.files {
            let mut absolute_path = absolute_clean_path(input_file)?;
            let relative_path = absolute_path
                .strip_prefix(&input_dir)
                .with_context(|| {
                    format!(
                        "Input file {} is not under {}",
                        &absolute_path.to_string_lossy(),
                        &input_dir.to_string_lossy()
                    )
                })?
                .to_path_buf();
            if self.follow_symlinks {
                absolute_path = tokio::fs::canonicalize(absolute_path).await?
            }

            if !(self
                .exclude_patterns
                .iter()
                .any(|pattern| pattern.matches_path(&relative_path)))
            {
                let mut file = tokio::fs::File::open(&absolute_path).await?;
                let metadata = file.metadata().await?;
                let mut entry = ZipEntryBuilder::new(
                    relative_path.to_string_lossy().to_string().into(),
                    Compression::Deflate,
                );
                if let Ok(last_modified) = metadata.modified() {
                    let last_modified: chrono::DateTime<chrono::Utc> = last_modified.into();
                    entry = entry.last_modification_date(ZipDateTime::from_chrono(&last_modified));
                }
                let mut data = vec![];
                file.read_to_end(&mut data).await?;
                archive.write_entry_whole(entry, &data).await?;
            }
        }

        archive.close().await?;

        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum ExportInstanceFileMode {
    Required,
    Optional,
    Ignore,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ExportInstanceFileInfo {
    relative_path: PathBuf,
    full_path: PathBuf,
    export_mode: ExportInstanceFileMode,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ExportInstanceDirInfo {
    relative_path: PathBuf,
    full_path: PathBuf,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum ExportInstanceFileEntry {
    File(ExportInstanceFileInfo),
    Dir {
        info: ExportInstanceDirInfo,
        entries: Vec<ExportInstanceFileEntry>,
    },
}

impl ExportInstanceFileEntry {
    pub fn flatten(self) -> Vec<ExportInstanceFileInfo> {
        match self {
            Self::File(info) => vec![info],
            Self::Dir { info: _, entries } => entries
                .into_iter()
                .map(|entry| entry.flatten())
                .flatten()
                .collect(),
        }
    }
}

#[async_recursion::async_recursion]
pub async fn collect_files<
    RP: AsRef<Path> + Send,
    SP: AsRef<Path> + Send,
    IF: Fn(&Path, &Path) -> bool + Send,
    OF: Fn(&Path, &Path) -> bool + Send,
>(
    root_dir: RP,
    dir: SP,
    ignore_filter: IF,
    optional_filter: OF,
) -> anyhow::Result<Vec<ExportInstanceFileEntry>> {
    let dir = dir.as_ref();
    let root_dir = root_dir.as_ref();
    let mut out_entires = Vec::new();

    if !tokio::fs::try_exists(&dir).await? {
        anyhow::bail!("{} does not exist, can not walk", dir.to_string_lossy());
    }
    if !dir.is_dir() {
        anyhow::bail!("{} is not a directory, can not walk", dir.to_string_lossy());
    }

    let mut entries = tokio::fs::read_dir(&dir).await?;
    while let Some(entry) = entries.next_entry().await? {
        let entry_path = entry.path();
        // follow symlinks by canonicalizing path
        let canonical_entry_path = tokio::fs::canonicalize(&entry_path).await?;
        let relative_path = entry_path.strip_prefix(&root_dir).with_context(|| {
            format!(
                "Walked path {} not relative to instance {}",
                entry_path.to_string_lossy(),
                root_dir.to_string_lossy()
            )
        })?;
        if canonical_entry_path.is_dir() {
            out_entires.push(ExportInstanceFileEntry::Dir {
                info: ExportInstanceDirInfo {
                    relative_path,
                    full_path: canonical_entry_path,
                },
                entries: collect_files(
                    &root_dir,
                    &canonical_entry_path,
                    ignore_filter,
                    optional_filter,
                )
                .await?,
            });
        } else {
            let ignore = ignore_filter(relative_path, &canonical_entry_path);
            let optional = optional_filter(relative_path, &canonical_entry_path);

            let export_entry = ExportInstanceFileEntry::File(ExportInstanceFileInfo {
                relative_path: relative_path.to_path_buf(),
                full_path: canonical_entry_path,
                export_mode: if ignore {
                    ExportInstanceFileMode::Ignore
                } else if optional {
                    ExportInstanceFileMode::Optional
                } else {
                    ExportInstanceFileMode::Required
                },
            });
            out_entires.push(export_entry);
        }
    }
    Ok(out_entires)
}
