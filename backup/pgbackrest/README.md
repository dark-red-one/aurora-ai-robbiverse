# pgBackRest Dual-Repo Template

- repo1: Elest.io S3 (offsite)
- repo2: NAS MinIO (local)

Steps:
1) Install pgBackRest on Aurora and towns.
2) Put credentials and correct endpoints.
3) Enable WAL archiving in postgresql.conf:
   archive_mode=on
   archive_command=pgbackrest
