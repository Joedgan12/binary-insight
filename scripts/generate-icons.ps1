Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$iconsDir = "$PSScriptRoot\..\src-tauri\icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

function Draw-BinaryInsightIcon {
    param([int]$Size)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode   = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # ── Background: rounded-rect dark navy ──────────────────────────────────
    $bgBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $radius   = [int]($Size * 0.18)
    $rect     = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $path     = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X,                         $rect.Y,                          $radius*2, $radius*2, 180, 90)
    $path.AddArc($rect.Right - $radius*2,         $rect.Y,                          $radius*2, $radius*2, 270, 90)
    $path.AddArc($rect.Right - $radius*2,         $rect.Bottom - $radius*2,         $radius*2, $radius*2,   0, 90)
    $path.AddArc($rect.X,                         $rect.Bottom - $radius*2,         $radius*2, $radius*2,  90, 90)
    $path.CloseFigure()
    $g.FillPath($bgBrush, $path)

    # ── Grid of hex digits in top-left area ─────────────────────────────────
    $hexChars  = @('0','1','A','F','3','E','8','D','2','B','5','C','7','9','4','6')
    $cols      = 4
    $rows      = 4
    $cellSize  = [int]($Size * 0.18)
    $startX    = [int]($Size * 0.06)
    $startY    = [int]($Size * 0.06)
    $fontSize  = [int]($Size * 0.095)
    $font      = New-Object System.Drawing.Font("Consolas", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $dimBrush  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(50,  99, 179, 255))
    $brightBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(130, 99, 179, 255))
    $sf        = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $highlighted = @(5, 6, 9, 10)   # inner 2x2 — brighter

    for ($i = 0; $i -lt $hexChars.Count; $i++) {
        $col  = $i % $cols
        $row  = [int]($i / $cols)
        $cx   = $startX + $col * $cellSize + $cellSize / 2
        $cy   = $startY + $row * $cellSize + $cellSize / 2
        $br   = if ($highlighted -contains $i) { $brightBrush } else { $dimBrush }
        $cr   = New-Object System.Drawing.RectangleF(($cx - $cellSize/2), ($cy - $cellSize/2), $cellSize, $cellSize)
        $g.DrawString($hexChars[$i], $font, $br, $cr, $sf)
    }

    # ── Central glowing "0x" mark ─────────────────────────────────────────
    $bigSize  = [int]($Size * 0.38)
    $bigFont  = New-Object System.Drawing.Font("Consolas", $bigSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

    # Glow layer
    $glowAlphas = @(18, 35, 55, 75)
    $glowOffsets = @(6, 4, 2, 1)
    for ($gi = 0; $gi -lt $glowAlphas.Count; $gi++) {
        $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($glowAlphas[$gi], 59, 130, 246))
        $off = $glowOffsets[$gi]
        $gr2 = New-Object System.Drawing.RectangleF(-$off, ($Size*0.28 - $off), ($Size + $off*2), ($Size*0.5 + $off*2))
        $g.DrawString("0x", $bigFont, $glowBrush, $gr2, $sf)
        $glowBrush.Dispose()
    }

    # Main text
    $mainBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
    $textRect  = New-Object System.Drawing.RectangleF(0, ($Size * 0.28), $Size, ($Size * 0.5))
    $g.DrawString("0x", $bigFont, $mainBrush, $textRect, $sf)

    # ── Accent underline bar ──────────────────────────────────────────────
    $barH    = [int]($Size * 0.06)
    $barY    = [int]($Size * 0.80)
    $barPad  = [int]($Size * 0.08)
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
    $barRect = New-Object System.Drawing.Rectangle($barPad, $barY, ($Size - $barPad*2), $barH)
    $barRadius = [int]($barH * 0.5)
    $barPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $barPath.AddArc($barRect.X,                     $barRect.Y,                      $barRadius*2, $barRadius*2, 180, 90)
    $barPath.AddArc($barRect.Right - $barRadius*2,  $barRect.Y,                      $barRadius*2, $barRadius*2, 270, 90)
    $barPath.AddArc($barRect.Right - $barRadius*2,  $barRect.Bottom - $barRadius*2,  $barRadius*2, $barRadius*2,   0, 90)
    $barPath.AddArc($barRect.X,                     $barRect.Bottom - $barRadius*2,  $barRadius*2, $barRadius*2,  90, 90)
    $barPath.CloseFigure()
    $g.FillPath($accentBrush, $barPath)

    # ── Small "INSIGHT" label ─────────────────────────────────────────────
    if ($Size -ge 64) {
        $labelSize  = [int]($Size * 0.10)
        $labelFont  = New-Object System.Drawing.Font("Arial", $labelSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
        $labelRect  = New-Object System.Drawing.RectangleF(0, ($Size * 0.89), $Size, ($Size * 0.14))
        $sf2        = New-Object System.Drawing.StringFormat
        $sf2.Alignment = [System.Drawing.StringAlignment]::Center
        $sf2.LineAlignment = [System.Drawing.StringAlignment]::Center
        $g.DrawString("INSIGHT", $labelFont, $labelBrush, $labelRect, $sf2)
        $labelFont.Dispose(); $labelBrush.Dispose(); $sf2.Dispose()
    }

    $g.Dispose()
    return $bmp
}

# ── Save PNG sizes ────────────────────────────────────────────────────────────
function Save-Png {
    param([System.Drawing.Bitmap]$src, [int]$w, [int]$h, [string]$path)
    $resized = New-Object System.Drawing.Bitmap($src, (New-Object System.Drawing.Size($w, $h)))
    $resized.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Host "  Saved: $(Split-Path $path -Leaf) ($w x $h)"
}

Write-Host "Generating Binary Insight icons..."

$master = Draw-BinaryInsightIcon -Size 1024

Save-Png $master 32  32  "$iconsDir\32x32.png"
Save-Png $master 128 128 "$iconsDir\128x128.png"
Save-Png $master 256 256 "$iconsDir\128x128@2x.png"
Save-Png $master 512 512 "$iconsDir\512x512.png"

# ── Build icon.ico (Windows multi-size ICO) ──────────────────────────────────
function Build-Ico {
    param([string]$outPath)

    $sizes   = @(16, 24, 32, 48, 64, 128, 256)
    $pngBlobs = @()

    foreach ($sz in $sizes) {
        $tmp   = New-Object System.Drawing.Bitmap($master, (New-Object System.Drawing.Size($sz, $sz)))
        $ms    = New-Object System.IO.MemoryStream
        $tmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $pngBlobs += ,$ms.ToArray()
        $tmp.Dispose(); $ms.Dispose()
    }

    $stream = New-Object System.IO.FileStream($outPath, [System.IO.FileMode]::Create)
    $writer = New-Object System.IO.BinaryWriter($stream)

    # ICO header
    $writer.Write([int16]0)            # Reserved
    $writer.Write([int16]1)            # Type: 1 = ICO
    $writer.Write([int16]$sizes.Count) # Image count

    # Directory entries: offset starts after header (6) + directory (16 * count)
    $dirSize   = 16 * $sizes.Count
    $dataOffset = 6 + $dirSize

    foreach ($blob in $pngBlobs) {
        $sz = if ($blob.Length -gt 4) {
            # read PNG dimensions
            $w = ([int]$blob[16] -shl 24) + ([int]$blob[17] -shl 16) + ([int]$blob[18] -shl 8) + [int]$blob[19]
            $h = ([int]$blob[20] -shl 24) + ([int]$blob[21] -shl 16) + ([int]$blob[22] -shl 8) + [int]$blob[23]
            $w
        } else { 0 }

        $szByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
        $writer.Write($szByte)  # Width (0 = 256)
        $writer.Write($szByte)  # Height
        $writer.Write([byte]0)           # Color palette
        $writer.Write([byte]0)           # Reserved
        $writer.Write([int16]1)          # Color planes
        $writer.Write([int16]32)         # Bits per pixel
        $writer.Write([int32]$blob.Count) # Data size
        $writer.Write([int32]$dataOffset)
        $dataOffset += $blob.Count
    }

    # Write PNG blobs
    foreach ($blob in $pngBlobs) {
        $writer.Write($blob)
    }

    $writer.Close(); $stream.Close()
    Write-Host "  Saved: icon.ico ($($sizes -join ',') px)"
}

Build-Ico "$iconsDir\icon.ico"

# ── Write a stub .icns for macOS (just rename 512.png as placeholder) ─────────
$master.Save("$iconsDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Copy-Item "$iconsDir\512x512.png" "$iconsDir\icon.icns" -Force
Write-Host "  Saved: icon.icns (PNG stub - macOS)"

$master.Dispose()

Write-Host ""
Write-Host "All icons generated in: $iconsDir"
