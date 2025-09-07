# File Backup

Config:
```yaml
with:
  base_backup_dir: /path/to/base
  backup_cfg: |
    backups:
      - enabled: true
        src_dir: /path/to/src
        dst_dir: dst1  # relative to base_backup_dir, optional
        files:
          - file1
          - abc*.py
        dirs:
          - dir1
          - dir2
      - enabled: true
        src_dir: /path/to/src2
        skip_non_exist: true
        dst_dir: dstd  # relative to base_backup_dir, optional
        files:
          - file1
          - abc*.py
        dirs:
          - dir1
          - dir2
```