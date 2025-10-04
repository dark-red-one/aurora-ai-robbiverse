# Vengeance Ubuntu Installation Script
# PowerShell commands to download Ubuntu and create bootable USB

Write-Host "🐧 VENGEANCE UBUNTU SETUP SCRIPT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Create downloads directory
$downloadDir = "$env:USERPROFILE\Downloads\ubuntu-setup"
New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
Set-Location $downloadDir

# Download Ubuntu 22.04 LTS Desktop ISO
Write-Host "📥 Downloading Ubuntu 22.04 LTS Desktop..." -ForegroundColor Yellow
$ubuntuUrl = "https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso"
$ubuntuIso = "$downloadDir\ubuntu-22.04.3-desktop-amd64.iso"

if (-not (Test-Path $ubuntuIso)) {
    Invoke-WebRequest -Uri $ubuntuUrl -OutFile $ubuntuIso -UseBasicParsing
    Write-Host "✅ Ubuntu ISO downloaded" -ForegroundColor Green
} else {
    Write-Host "✅ Ubuntu ISO already exists" -ForegroundColor Green
}

# Verify ISO download
if (Test-Path $ubuntuIso) {
    $isoSize = (Get-Item $ubuntuIso).Length / 1GB
    Write-Host "📊 ISO Size: $([math]::Round($isoSize, 2)) GB" -ForegroundColor Green
    
    if ($isoSize -gt 3.5) {
        Write-Host "✅ ISO appears complete (expected ~4GB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ISO might be incomplete (too small)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ISO download failed" -ForegroundColor Red
    exit 1
}

# Download Rufus (most reliable USB creator)
Write-Host "📥 Downloading Rufus USB creator..." -ForegroundColor Yellow
$rufusUrl = "https://github.com/pbatard/rufus/releases/download/v4.2/rufus-4.2.exe"
$rufusPath = "$downloadDir\rufus.exe"

if (-not (Test-Path $rufusPath)) {
    Invoke-WebRequest -Uri $rufusUrl -OutFile $rufusPath -UseBasicParsing
    Write-Host "✅ Rufus downloaded" -ForegroundColor Green
} else {
    Write-Host "✅ Rufus already exists" -ForegroundColor Green
}

# List available USB drives
Write-Host "💾 Available USB drives:" -ForegroundColor Yellow
$usbDrives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 2}
if ($usbDrives) {
    $usbDrives | ForEach-Object {
        $size = [math]::Round($_.Size / 1GB, 2)
        Write-Host "   Drive $($_.DeviceID) - $size GB" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ No USB drives detected" -ForegroundColor Red
    Write-Host "   Please insert a USB drive (8GB+ recommended)" -ForegroundColor Yellow
}

# Launch Rufus
Write-Host "🚀 Launching Rufus..." -ForegroundColor Yellow
Start-Process $rufusPath

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. In Rufus:" -ForegroundColor White
Write-Host "   - Select your USB drive" -ForegroundColor White  
Write-Host "   - Click 'SELECT' and choose: $ubuntuIso" -ForegroundColor White
Write-Host "   - Partition scheme: GPT" -ForegroundColor White
Write-Host "   - Target system: UEFI" -ForegroundColor White
Write-Host "   - Click 'START'" -ForegroundColor White
Write-Host ""
Write-Host "2. After USB creation:" -ForegroundColor White
Write-Host "   - Restart Vengeance" -ForegroundColor White
Write-Host "   - Press F12 during boot for boot menu" -ForegroundColor White
Write-Host "   - Select USB drive" -ForegroundColor White
Write-Host "   - Install Ubuntu" -ForegroundColor White
Write-Host ""
Write-Host "3. Your Aurora project is safe on RunPod!" -ForegroundColor Green
Write-Host "   - 150+ files backed up in cloud" -ForegroundColor Green
Write-Host "   - Access via code-server after Ubuntu install" -ForegroundColor Green
Write-Host ""
Write-Host "🔥 Ready to transform Vengeance into a Linux AI development beast!" -ForegroundColor Magenta
