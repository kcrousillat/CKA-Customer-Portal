# Updates the CKA Selections portal and deploys the Worker.
#
# Run it from anywhere - it finds the project folder itself rather than
# depending on where PowerShell happened to start.
#
#   powershell -ExecutionPolicy Bypass -File "$HOME\Desktop\update-cka-portal.ps1"
#
# ASCII ONLY. Windows PowerShell reads .ps1 as ANSI, so a curly quote or an
# em dash arrives as mojibake in the middle of a string and the whole file
# fails to parse. Keep every character in this file plain.

$ErrorActionPreference = 'Stop'
$branch = 'claude/exciting-heisenberg-pqq69a'
$raw    = "https://raw.githubusercontent.com/kcrousillat/CKA-Customer-Portal/refs/heads/$branch"
$desk   = [Environment]::GetFolderPath('Desktop')

function Say($msg, $colour = 'Gray') { Write-Host $msg -ForegroundColor $colour }

Say ""
Say "CKA Selections - update and deploy" 'Cyan'
Say "----------------------------------"

# 1. The portal page. This is the file opened by hand, so it goes to the
#    Desktop whatever else happens.
Say ""
Say "1/3  Downloading the portal page..."
try {
  curl.exe -fsSL -o "$desk\selections-portal.html" "$raw/selections-portal.html"
  $kb = [math]::Round((Get-Item "$desk\selections-portal.html").Length / 1KB)
  Say "     Done. selections-portal.html is on your Desktop ($kb KB)." 'Green'
} catch {
  Say "     FAILED to download the portal page. Check your internet and try again." 'Red'
  Say "     Nothing was changed." 'Red'
  exit 1
}

# 2. Find the Worker by its config file rather than by a remembered path: the
#    project folder gets re-downloaded and renamed, the config file does not.
Say ""
Say "2/3  Finding the Worker folder..."
$cfg = Get-ChildItem -Path $desk -Filter wrangler.toml -Recurse -ErrorAction SilentlyContinue |
       Select-Object -First 1
if (-not $cfg) {
  Say "     Could not find the Worker folder on your Desktop." 'Yellow'
  Say "     The portal page above is updated and usable." 'Yellow'
  Say "     Send this message to Claude and it will sort the rest out." 'Yellow'
  exit 0
}
$workerDir = $cfg.Directory.FullName
Say "     Found: $workerDir" 'Green'

# 3. Always download before deploying. Deploying without this step pushes
#    whatever is already on disk, which is how a stale Worker went live once.
#    The Worker now serves the portal page too, so public/index.html has to be
#    refreshed in the same breath or the hosted page lags behind the Desktop one.
Say ""
Say "3/3  Downloading the Worker code and deploying..."
try {
  curl.exe -fsSL -o "$workerDir\src\index.js" "$raw/worker/src/index.js"
  $b = (Get-Item "$workerDir\src\index.js").Length
  if ($b -lt 5000) { throw "index.js came back too small ($b bytes), so the download did not work." }
  Say "     Worker code downloaded ($b bytes)." 'Green'

  New-Item -ItemType Directory -Force -Path "$workerDir\public" | Out-Null
  Copy-Item "$desk\selections-portal.html" "$workerDir\public\index.html" -Force
  Say "     Portal page staged for hosting." 'Green'
} catch {
  Say "     FAILED to download the Worker code: $_" 'Red'
  Say "     Nothing was deployed. The portal page is still updated." 'Red'
  exit 1
}

# Wrangler runs through npx, which ships with Node.js. A bare "npx" depends on
# PATH, and PATH is the thing that breaks: a Node update, a new user profile or
# a shell opened at the wrong moment and the deploy stops working while every
# other step still succeeds. So look for it properly before giving up.
function Find-Npx {
  $onPath = Get-Command npx -ErrorAction SilentlyContinue
  if ($onPath) { return $onPath.Source }
  $guesses = @(
    "$env:ProgramFiles\nodejs\npx.cmd",
    "${env:ProgramFiles(x86)}\nodejs\npx.cmd",
    "$env:LOCALAPPDATA\Programs\nodejs\npx.cmd",
    "$env:APPDATA\npm\npx.cmd",
    "$env:LOCALAPPDATA\Volta\bin\npx.exe"
  )
  foreach ($g in $guesses) { if ($g -and (Test-Path $g)) { return $g } }
  # nvm for Windows keeps one folder per version; take the newest.
  $nvm = Get-ChildItem "$env:APPDATA\nvm" -Filter npx.cmd -Recurse -ErrorAction SilentlyContinue |
         Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($nvm) { return $nvm.FullName }
  return $null
}

$npx = Find-Npx
if (-not $npx) {
  Say ""
  Say "Could not find npx, which means Node.js is missing from this computer" 'Red'
  Say "or is not on the PATH. Everything else worked - the portal page is" 'Yellow'
  Say "updated and the Worker code is downloaded and staged." 'Yellow'
  Say ""
  Say "To fix it: install the LTS version from https://nodejs.org , tick the" 'Cyan'
  Say "box that says Add to PATH, then CLOSE this window, open a new" 'Cyan'
  Say "PowerShell and run this script again. The PATH only updates in windows" 'Cyan'
  Say "opened after the install." 'Cyan'
  Say ""
  exit 1
}
if ($npx -ne 'npx') { Say "     Using npx at: $npx" 'Gray' }

Push-Location $workerDir
try {
  & $npx wrangler deploy
  if ($LASTEXITCODE -ne 0) { throw "wrangler exited with code $LASTEXITCODE" }
  Say ""
  Say "All done. The portal page and the Worker are both current." 'Green'
  Say "Owners open it at:  https://cka-selections-api.kevin-7c1.workers.dev/?p=PORTALKEY" 'Cyan'
} catch {
  Say ""
  Say "The deploy did not finish: $_" 'Red'
  Say "The portal page on your Desktop is still updated and safe to open." 'Yellow'
} finally {
  Pop-Location
}
Say ""
