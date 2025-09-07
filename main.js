function checkBackups(backups) {
    if (!backups || !Array.isArray(backups)) {
        throw new Error('backups must be an array')
    }

    const jsonSchema = `
    {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "description": "A list of backup configurations.",
  "items": {
    "type": "object",
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "If true, skip it."
      },
      "src_dir": {
        "type": "string",
        "description": "The source directory for the backup."
      },
      "dst_dir": {
        "type": "string",
        "description": "The destination directory for the backup."
      },
      "files": {
        "type": "array",
        "description": "A list of files to be included in the backup.",
        "items": {
          "type": "string"
        },
        "minItems": 1
      },
      "dirs": {
        "type": "array",
        "description": "A list of directories to be included in the backup.",
        "items": {
          "type": "string"
        },
        "minItems": 1
      }
    },
    "required": [
      "src_dir"
    ],
    "anyOf": [
      { "required": ["files"] },
      { "required": ["dirs"] }
    ],
    "additionalProperties": false
  }
}`
    core.validateJSONSchema(backups, jsonSchema)
}

function doBackups(baseDir, backups) {
    for (let bkCfg of backups) {
        let enabled = bkCfg.enabled
        if (enabled === false) {
            console.log(`skip backup ${bkCfg.src_dir}`)
            continue
        }
        let srcDir = bkCfg.src_dir
        let dstDir = baseDir
        if (bkCfg.dst_dir) {
            dstDir = `${baseDir}/${bkCfg.dst_dir}`
        }
        console.log(`backup ${srcDir} to ${dstDir}`)
        let ret = core.runCmd("mkdir", ['-p', dstDir])
        if (ret.status !== 0) {
            throw new Error(`mkdir -p ${dstDir} failed: ${ret.stderr}`)
        }
        const files = bkCfg.files || []
        for (let file of files) {
            console.log(`backup file: ${file}`)
            let quote = file.includes("*")? "": "\""
            let ret = core.runCmd("zsh", ["-c", `cp -L ${quote}${srcDir}/${file}${quote} ${quote}${dstDir}/${quote}`])
            if (ret.status !== 0) {
                throw new Error(`backup file ${file} failed: ${ret.stderr}`)
            }
        }
        const dirs = bkCfg.dirs || []
        for (let dir of dirs) {
            console.log(`backup dir: ${dir}`)
            let quote = dir.includes("*")? "": "\""
            let ret = core.runCmd("bash", ['-c', `cp -rL ${quote}${srcDir}/${dir}${quote} ${quote}${dstDir}/${quote}`])
            if (ret.status !== 0) {
                throw new Error(`backup dir ${dir} failed: ${ret.stderr}`)
            }
        }
    }
}

function main() {
    console.log('start backup')
    let baseDir = env.get('base_backup_dir')
    let backCfg = env.get('backup_cfg')
    if (!backCfg) {
        throw new Error('backup-cfg is not set')
    }
    let cfg = core.parseYaml(backCfg)
    console.log("loaded backup config")

    checkBackups(cfg.backups)
    doBackups(baseDir, cfg.backups)


}

main()