use std::{
    fs::{self, File},
    io,
    path::{Path, PathBuf},
};

use itertools::Itertools;
use tokio::sync::mpsc;
use zip::{write::FileOptions, ZipWriter};

use crate::{
    domain::{
        instance::{ExportEntry, ExportTarget, InstanceId},
        vtask::VisualTaskId,
    },
    managers::{vtask::Subtask, ManagerRef},
};

mod curseforge_archive;
mod modrinth_archive;

#[derive(Debug)]
pub struct InstanceExportManager {}

impl InstanceExportManager {
    pub fn new() -> Self {
        Self {}
    }
}

impl ManagerRef<'_, InstanceExportManager> {
    pub async fn export_instance(
        self,
        instance_id: InstanceId,
        target: ExportTarget,
        save_path: PathBuf,
        link_mods: bool,
        filter: ExportEntry,
    ) -> anyhow::Result<VisualTaskId> {
        match target {
            ExportTarget::Curseforge => {
                curseforge_archive::export_curseforge(
                    self.app.clone(),
                    instance_id,
                    save_path,
                    link_mods,
                    filter,
                )
                .await
            }
            ExportTarget::Modrinth => {
                modrinth_archive::export_modrinth(
                    self.app.clone(),
                    instance_id,
                    save_path,
                    link_mods,
                    filter,
                )
                .await
            }
        }
    }
}

enum ZipMode<'a, W: io::Write + io::Seek> {
    Count(&'a mut u32),
    Create(&'a mut ZipWriter<W>, FileOptions, mpsc::Sender<()>),
}

fn zip_excluding<W: io::Write + io::Seek>(
    mut mode: ZipMode<W>,
    base_path: &Path,
    prefix: &str,
    filter: &ExportEntry,
) -> anyhow::Result<()> {
    fn walk_recursive<W: io::Write + io::Seek>(
        mode: &mut ZipMode<W>,
        path: &Path,
        prefix: &str,
        relpath: &[&str],
        filter: Option<&ExportEntry>,
    ) -> anyhow::Result<()> {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let name = entry.file_name();
            let name = name.to_string_lossy();

            let Some(subfilter) = filter
                .as_ref()
                .map(|f| f.0.get(&*name))
                .unwrap_or(Some(&None))
            else {
                continue;
            };

            let pathstr =
                String::from(prefix) + "/" + &relpath.iter().chain([&*name].iter()).join("/");

            if entry.metadata()?.is_dir() {
                let relpath = &[relpath, &[&*name][..]].concat()[..];
                walk_recursive(mode, &entry.path(), prefix, relpath, subfilter.as_ref())?;
            } else {
                match mode {
                    ZipMode::Count(counter) => {
                        **counter += 1;
                    }
                    ZipMode::Create(zip, options, notify) => {
                        zip.start_file(pathstr, *options)?;
                        io::copy(&mut File::open(entry.path())?, zip)?;
                        let _ = notify.blocking_send(());
                    }
                }
            }
        }

        Ok(())
    }

    walk_recursive(&mut mode, base_path, prefix, &[], Some(filter))
}
