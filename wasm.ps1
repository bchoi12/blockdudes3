[string[]]$src_files = @("game.go", "circle.go", "data.go", "grid.go", "init.go", "level.go", "log.go", "object.go", "objects.go", "player.go", "profile.go", "profilemath.go", "rec2.go", "rotpoly.go", "shot.go", "state.go", "structs.go", "subprofile.go", "thing.go", "types.go", "updatebuffer.go", "util.go", "weapon.go")

foreach ($file in $src_files) {
	cp "$($file)" "wasm/tmp_$($file)"
}

cp "wasm/wasm_main.go" "wasm/wasm_main_copy.txt"

$env:GOOS="js"
$env:GOARCH="wasm"
cd wasm
go build -o game.wasm -v .
cd ..
Remove-Item Env:\GOOS
Remove-Item Env:\GOARCH