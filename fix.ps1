$path = 'Code.gs'
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$win874 = [System.Text.Encoding]::GetEncoding(874)
$utf8 = [System.Text.Encoding]::UTF8
$bytes = $win874.GetBytes($text)
$restored = $utf8.GetString($bytes)
[System.IO.File]::WriteAllText($path, $restored, $utf8)
