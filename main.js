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
        "description": "If false, skip it."
      },
      "skip_non_exist": {
        "type": "boolean",
        "description": "If true, skip non-exist file."
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
        let srcDir = bkCfg.src_dir?`${bkCfg.src_dir}/`:''
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
            let wildcard = file.includes("*")
            let quote = wildcard? "": "\""
            let skipNonExist = bkCfg.skip_non_exist || false
            let cmd = ""
            if (skipNonExist && !wildcard) {
                cmd = `[[ -f ${quote}${srcDir}${file}${quote} ]] && cp -L ${quote}${srcDir}${file}${quote} ${quote}${dstDir}/${quote} || exit 0`
            } else {
                cmd = `cp -L ${quote}${srcDir}${file}${quote} ${quote}${dstDir}/${quote}`
            }

            let ret = core.runCmd("bash", ["-c", cmd])
            if (ret.status !== 0) {
                throw new Error(`backup file ${file} failed: ${ret.stderr}`)
            }
        }
        const dirs = bkCfg.dirs || []
        for (let dir of dirs) {
            console.log(`backup dir: ${dir}`)
            let wildcard = dir.includes("*")
            let quote = wildcard? "": "\""
            let skipNonExist = bkCfg.skip_non_exist || false

            let cmd = ""
            if (skipNonExist && !wildcard) {
                cmd = `[[ -d ${quote}${srcDir}${dir}${quote} ]] && cp -rL ${quote}${srcDir}${dir}${quote} ${quote}${dstDir}/${quote} || exit 0`
            } else {
                cmd = `cp -rL ${quote}${srcDir}${dir}${quote} ${quote}${dstDir}/${quote}`
            }


            let ret = core.runCmd("bash", ['-c', cmd])
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
    let cfg = core.parseYAML(backCfg)
    console.log("loaded backup config")

    checkBackups(cfg.backups)
    doBackups(baseDir, cfg.backups)


}

main()