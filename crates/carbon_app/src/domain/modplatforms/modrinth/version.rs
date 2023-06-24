//! Models related to versions
//!
//! [documentation](https://docs.modrinth.com/api-spec/#tag/version_model)

use super::*;
use std::collections::HashMap;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Version {
    pub name: ArcStr,
    /// The version number.
    /// Ideally, this will follow semantic versioning.
    pub version_number: ArcStr,
    pub changelog: Option<String>,
    pub dependencies: Vec<Dependency>,
    pub game_versions: Vec<ArcStr>,
    /// The release channel for this version
    pub version_type: VersionType,
    pub loaders: Vec<ArcStr>,
    pub featured: bool,
    pub status: Option<Status>,
    pub requested_status: Option<RequestedStatus>,
    pub id: ArcStr,
    /// The ID of the project this version is for
    pub project_id: ArcStr,
    /// The ID of the author who published this version
    pub author_id: ArcStr,
    pub date_published: UtcDateTime,
    pub downloads: Number,
    /// A link to the version's changelog (only present for old versions)
    #[deprecated = "Read from `changelog` instead"]
    #[serde(deserialize_with = "deserialise_optional_url")]
    pub changelog_url: Option<Url>,
    /// A list of files available for download
    pub files: Vec<VersionFile>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct VersionFile {
    pub hashes: Hashes,
    pub url: Url,
    pub filename: ArcStr,
    /// Whether the file is the primary file of its version.
    ///
    /// There can only be a maximum of one primary file per version.
    /// If there are no primary files specified, the first file can be taken as the primary file.
    pub primary: bool,
    /// The size of the file in bytes
    pub size: Number,
    /// The type of the additional file, used mainly for adding resource packs to datapacks
    pub file_type: Option<AdditionalFileType>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Hashes {
    pub sha512: ArcStr,
    pub sha1: ArcStr,
    /// A map of other hashes that may have been provided
    #[serde(flatten)]
    pub others: HashMap<ArcStr, ArcStr>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct LatestVersionBody {
    pub loaders: Vec<ArcStr>,
    pub game_versions: Vec<ArcStr>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct LatestVersionsBody {
    pub hashes: Vec<ArcStr>,
    pub algorithm: HashAlgorithm,
    pub loaders: Vec<ArcStr>,
    pub game_versions: Vec<ArcStr>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Dependency {
    pub version_id: Option<ArcStr>,
    pub project_id: Option<ArcStr>,
    pub file_name: Option<ArcStr>,
    pub dependency_type: DependencyType,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum HashAlgorithm {
    SHA512,
    SHA1,
}

#[derive(Deserialize, Serialize, Debug, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VersionType {
    Alpha,
    Beta,
    Release,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DependencyType {
    Required,
    Optional,
    Incompatible,
    Embedded,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Listed,
    Archived,
    Draft,
    Unlisted,
    Scheduled,
    Unknown,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RequestedStatus {
    Listed,
    Archived,
    Draft,
    Unlisted,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum AdditionalFileType {
    RequiredResourcePack,
    OptionalResourcePack,
}
