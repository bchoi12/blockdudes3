[string[]]$src_files = @("game.go", "grid.go", "object.go", "player.go", "profile.go", "structs.go", "types.go", "util.go")

foreach ($file in $src_files) {
	cp "$($file)" "wasm/tmp_$($file)"
}

$env:GOOS="js"
$env:GOARCH="wasm"
cd wasm
go build -o game.wasm -v .
cd ..
Remove-Item Env:\GOOS
Remove-Item Env:\GOARCH