# Vengeance Windows Backup Script
# Run as Administrator in PowerShell

Write-Host "🔥 VENGEANCE WINDOWS BACKUP SCRIPT 🔥" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red

# Create backup directory
$BackupDir = "C:\VengeanceBackup"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
    Write-Host "✅ Created backup directory: $BackupDir" -ForegroundColor Green
}

# Create subdirectories
$SubDirs = @("Documents", "Desktop", "Downloads", "Projects", "Configs", "Drivers", "Programs")
foreach ($dir in $SubDirs) {
    $path = Join-Path $BackupDir $dir
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "✅ Created subdirectory: $dir" -ForegroundColor Green
    }
}

# Backup user data
Write-Host "📁 Backing up user data..." -ForegroundColor Yellow
$UserProfile = $env:USERPROFILE

# Backup Documents
robocopy "$UserProfile\Documents" "$BackupDir\Documents" /E /R:3 /W:10 /MT:8
Write-Host "✅ Documents backed up" -ForegroundColor Green

# Backup Desktop
robocopy "$UserProfile\Desktop" "$BackupDir\Desktop" /E /R:3 /W:10 /MT:8
Write-Host "✅ Desktop backed up" -ForegroundColor Green

# Backup Downloads
robocopy "$UserProfile\Downloads" "$BackupDir\Downloads" /E /R:3 /W:10 /MT:8
Write-Host "✅ Downloads backed up" -ForegroundColor Green

# Backup installed programs
Write-Host "📋 Backing up installed programs list..." -ForegroundColor Yellow
Get-WmiObject -Class Win32_Product | Select-Object Name, Version | Export-Csv "$BackupDir\Programs\installed_programs.csv" -NoTypeInformation
Write-Host "✅ Programs list backed up" -ForegroundColor Green

# Backup network settings
Write-Host "🌐 Backing up network settings..." -ForegroundColor Yellow
netsh wlan export profile folder="$BackupDir\Configs" key=clear
Write-Host "✅ Network settings backed up" -ForegroundColor Green

# Backup system info
Write-Host "💻 Backing up system information..." -ForegroundColor Yellow
systeminfo > "$BackupDir\Configs\system_info.txt"
Get-ComputerInfo | Export-Csv "$BackupDir\Configs\computer_info.csv" -NoTypeInformation
Write-Host "✅ System info backed up" -ForegroundColor Green

# Backup drivers
Write-Host "🔧 Backing up driver information..." -ForegroundColor Yellow
Get-WmiObject Win32_PnPSignedDriver | Where-Object {$_.DeviceName -like "*NVIDIA*"} | Export-Csv "$BackupDir\Drivers\nvidia_drivers.csv" -NoTypeInformation
Write-Host "✅ Driver info backed up" -ForegroundColor Green

# Create backup summary
$SummaryFile = "$BackupDir\backup_summary.txt"
@"
Vengeance Windows Backup Summary
===============================
Date: $(Get-Date)
User: $env:USERNAME
Computer: $env:COMPUTERNAME

Backed up directories:
- Documents: $UserProfile\Documents
- Desktop: $UserProfile\Desktop  
- Downloads: $UserProfile\Downloads

Backup location: $BackupDir
Total size: $((Get-ChildItem $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB) GB

Next steps:
1. Create Linux bootable USB
2. Disable Fast Startup in Power Options
3. Disable Secure Boot in BIOS (if needed)
4. Boot from Linux USB and install

Good luck with your Linux installation! 🔥
"@ | Out-File -FilePath $SummaryFile -Encoding UTF8

Write-Host "📄 Backup summary created: $SummaryFile" -ForegroundColor Green
Write-Host "✅ VENGEANCE BACKUP COMPLETE! 🔥" -ForegroundColor Red
Write-Host "Ready for Linux installation!" -ForegroundColor Green



