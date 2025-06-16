const core = require('@actions/core');
const outputs = require('./outputs.json');
const { execSync } = require('child_process');

function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0').toString().trim();
  } catch {
    return '';
  }
}

function getLastTagCommit(tag) {
  try {
    if (!tag) return '';
    return execSync(`git rev-list -n 1 ${tag}`).toString().trim();
  } catch {
    return '';
  }
}

/**
 * windUpJob
 * @param result
 * @returns {Promise<void>}
 */
module.exports = async (result) => {
  if (!result) {
    core.debug('No release published because of no result. Falling back to git for last release info.');
    const lastTag = getLastTag();
    const lastTagCommit = getLastTagCommit(lastTag);
    core.setOutput(outputs.last_release_version, lastTag);
    core.setOutput(outputs.last_release_git_head, lastTagCommit);
    core.setOutput(outputs.last_release_git_tag, lastTag);
    return Promise.resolve();
  }

  const {lastRelease = {}, commits, nextRelease, releases} = await result;

  core.setOutput(outputs.last_release_version, lastRelease.version || '');
  core.setOutput(outputs.last_release_git_head, lastRelease.gitHead || '');
  core.setOutput(outputs.last_release_git_tag, lastRelease.gitTag || '');
  if (lastRelease.version) {
    core.debug(`The last release was "${lastRelease.version}".`);
  }

  if (!nextRelease) {
    core.debug('No release published.');
    return Promise.resolve();
  }

  core.debug(`Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`);

  for (const release of releases) {
    core.debug(`The release was published with plugin "${release.pluginName}".`);
  }

  const {version, channel, notes, gitHead, gitTag} = nextRelease;
  const [major, minor, patch] = version.split(/\.|-|\s/g, 3);

  // set outputs
  core.setOutput(outputs.new_release_published, 'true');
  core.setOutput(outputs.new_release_version, version);
  core.setOutput(outputs.new_release_major_version, major);
  core.setOutput(outputs.new_release_minor_version, minor);
  core.setOutput(outputs.new_release_patch_version, patch);
  core.setOutput(outputs.new_release_channel, channel);
  core.setOutput(outputs.new_release_notes, notes);  
  core.setOutput(outputs.new_release_git_head, gitHead);
  core.setOutput(outputs.new_release_git_tag, gitTag);
};
