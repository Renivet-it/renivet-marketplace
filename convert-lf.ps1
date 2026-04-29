$f = "src/components/globals/forms/product-cart-add.tsx"
$content = Get-Content $f -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText((Resolve-Path $f).Path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done LF conversion"
