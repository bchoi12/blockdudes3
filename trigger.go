package main

import (
	"time"
)

type TriggerStateType uint8
const (
	unknownTriggerState TriggerStateType = iota
	readyTriggerState
	shootingTriggerState
	rotatingAmmoTriggerState
	reloadingTriggerState
)

type TriggerType uint8
const (
	unknownTrigger TriggerType = iota
	primaryTrigger
	secondaryTrigger
)

type Trigger struct {
	weapon Weapon

	pressed bool
	space SpaceType
	state TriggerStateType

	maxAmmo int
	ammo int
	ammoTimer Timer
	reloadTimer Timer

	// TODO: prob better in options struct
	projectileSize Vec2
	projectileRelativeSpeed bool
	projectileDeleteOnRelease bool
	projectileVel float64
	projectileAcc float64
	projectileJerk float64
	projectileLimit int
	currentProjectiles map[SpacedId]bool
}

func NewTrigger(weapon Weapon, space SpaceType) *Trigger {
	t := &Trigger {
		weapon: weapon,
		pressed: false,
		space: space,
		state: unknownTriggerState,

		maxAmmo: 0,
		ammo: 0,
		ammoTimer: NewTimer(0),
		reloadTimer: NewTimer(0),

		projectileSize: NewVec2(0, 0),
		projectileRelativeSpeed: false,
		projectileDeleteOnRelease: false,
		projectileVel: 0,
		projectileAcc: 0,
		projectileJerk: 0,
		projectileLimit: 0,
		currentProjectiles: make(map[SpacedId]bool),
	}

	switch space {
	case boltSpace:
		t.SetMaxAmmo(1)
		t.SetAmmoReloadTime(100 * time.Millisecond)
		t.SetReloadTime(180 * time.Millisecond)
		t.SetProjectileSize(NewVec2(0.22, 0.1))
		t.SetProjectileVel(30)
	case rocketSpace:
		t.SetMaxAmmo(1)
		t.SetReloadTime(1000 * time.Millisecond)
		t.SetProjectileSize(NewVec2(0.5, 0.5))
		t.SetProjectileVel(0)
		t.SetProjectileRelativeSpeed(true)
		t.SetProjectileAcc(24)
		t.SetProjectileJerk(48)
	case starSpace:
		t.SetMaxAmmo(4)
		t.SetAmmoReloadTime(125 * time.Millisecond)
		t.SetReloadTime(700 * time.Millisecond)
		t.SetProjectileVel(30)
		t.SetProjectileSize(NewVec2(0.3, 0.3))
	case grapplingHookSpace:
		t.SetMaxAmmo(1)
		t.SetReloadTime(1000 * time.Millisecond)
		t.SetProjectileSize(NewVec2(0.3, 0.3))
		t.SetProjectileDeleteOnRelease(true)
		t.SetProjectileVel(30)
		t.SetProjectileLimit(1)
	}
	t.Reload()
	return t
}

func (t Trigger) Space() SpaceType { return t.space }
func (t Trigger) State() TriggerStateType { return t.state }
func (t Trigger) Ammo() int { return t.ammo }
func (t Trigger) MaxAmmo() int { return t.maxAmmo }
func (t Trigger) Pressed() bool { return t.pressed }
func (t Trigger) ProjectileSize() Vec2 { return t.projectileSize }
func (t Trigger) ProjectileRelativeSpeed() bool { return t.projectileRelativeSpeed }
func (t Trigger) ProjectileDeleteOnRelease() bool { return t.projectileDeleteOnRelease }
func (t Trigger) ProjectileVel() float64 { return t.projectileVel } 
func (t Trigger) ProjectileAcc() float64 { return t.projectileAcc } 
func (t Trigger) ProjectileJerk() float64 { return t.projectileJerk } 
func (t Trigger) ProjectileLimit() int { return t.projectileLimit }

func (t *Trigger) SetPressed(pressed bool) {
	if t.Pressed() && t.State() == readyTriggerState {
		return
	}
	t.pressed = pressed
}
func (t *Trigger) SetMaxAmmo(maxAmmo int) { t.maxAmmo = maxAmmo }
func (t *Trigger) SetAmmoReloadTime(ammoReloadTime time.Duration) { t.ammoTimer.SetDuration(ammoReloadTime) }
func (t *Trigger) SetReloadTime(reloadTime time.Duration) { t.reloadTimer.SetDuration(reloadTime) }
func (t *Trigger) SetProjectileSize(size Vec2) { t.projectileSize = size }
func (t *Trigger) SetProjectileRelativeSpeed(relative bool) { t.projectileRelativeSpeed = relative }
func (t *Trigger) SetProjectileDeleteOnRelease(delete bool) { t.projectileDeleteOnRelease = delete }
func (t *Trigger) SetProjectileVel(vel float64) { t.projectileVel = vel }
func (t *Trigger) SetProjectileAcc(acc float64) { t.projectileAcc = acc }
func (t *Trigger) SetProjectileJerk(jerk float64) { t.projectileJerk = jerk }
func (t *Trigger) SetProjectileLimit(limit int) { t.projectileLimit = limit }

func (t *Trigger) Reload() { t.ammo = t.maxAmmo }

func (t *Trigger) UpdateState(grid *Grid, now time.Time) bool {
	if t.Ammo() > 0 && (t.Pressed() || t.Ammo() < t.MaxAmmo()) {
		if t.ammoTimer.On() {
			t.state = rotatingAmmoTriggerState
			return true
		}

		t.state = shootingTriggerState
		t.Shoot(grid, now)
		return true
	}

	if t.ProjectileDeleteOnRelease() {
		if !t.Pressed() {
			for sid, _ := range(t.currentProjectiles) {
				grid.Delete(sid)
			}
			t.Reload()
			t.state = readyTriggerState
			return true
		} else {
			t.state = rotatingAmmoTriggerState
			return true
		}
	} else if t.Ammo() == 0 {
		if t.reloadTimer.On() {
			t.state = reloadingTriggerState
			return true
		} else {
			t.Reload()
			t.state = readyTriggerState
			return true
		}
	}

	t.state = readyTriggerState
	return true
}

func (t *Trigger) Shoot(grid *Grid, now time.Time) {
	if t.projectileLimit > 0 && len(t.currentProjectiles) >= t.projectileLimit {
		for sid, _ := range(t.currentProjectiles) {
			if !grid.Has(sid) {
				delete(t.currentProjectiles, sid)
			}
		}

		if len(t.currentProjectiles) >= t.projectileLimit {
			return
		}
	}

	t.ammo -= 1
	t.ammoTimer.Start()
	t.reloadTimer.Start()

	if isWasm {
		return
	}

	init := NewObjectInit(grid.NextSpacedId(t.Space()), t.weapon.GetShotOrigin(), t.ProjectileSize())
	projectile := grid.New(init)
	projectile.SetOwner(t.weapon.GetOwner())
	projectile.SetDir(t.weapon.Dir())

	vel := t.weapon.Dir()
	vel.Scale(t.ProjectileVel())

	if t.ProjectileRelativeSpeed() {
		owner := grid.Get(t.weapon.GetOwner())
		if owner != nil {
			addedVel := t.weapon.Dir()
			addedVel.Scale(Max(1, Abs(addedVel.Dot(owner.Vel()))))
			vel.Add(addedVel, 1.0)
		}
	}
	projectile.SetVel(vel)

	acc := t.weapon.Dir()
	acc.Scale(t.ProjectileAcc())
	projectile.SetAcc(acc)

	jerk := t.weapon.Dir()
	jerk.Scale(t.ProjectileJerk())
	projectile.SetJerk(jerk)

	grid.Upsert(projectile)

	if t.ProjectileLimit() > 0 {
		t.currentProjectiles[projectile.GetSpacedId()] = true
	}
}