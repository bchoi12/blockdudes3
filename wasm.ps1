[string[]]$src_files = @("game.go", "association.go", "attachment.go", "attribute.go", "block.go", "blockgrid.go", "booster.go", "cardinal.go", "collideroptions.go", "color.go", "circle.go", "data.go", "equip.go", "equipcharger.go", "expiration.go", "explosion.go", "flag.go", "gamestate.go", "grid.go", "health.go", "init.go", "initprops.go", "jetpack.go", "keys.go", "launcher.go", "level.go", "light.go", "log.go", "msg.go", "object.go", "objectheap.go", "objects.go", "optional.go", "player.go", "profile.go", "profilemath.go", "projectile.go", "projectiles.go", "rec2.go", "rotpoly.go", "state.go", "structs.go", "subprofile.go", "timer.go", "util.go", "wall.go", "weapon.go")

foreach ($file in $src_files) {
	cp "$($file)" "wasm/tmp_$($file)"
}

cp "wasm/wasm_main.go" "wasm/wasm_main_copy.txt"

$env:GOOS="js"
$env:GOARCH="wasm"
cd wasm
go build -o ../client/dist/game.wasm -v .
cd ..
Remove-Item Env:\GOOS
Remove-Item Env:\GOARCH