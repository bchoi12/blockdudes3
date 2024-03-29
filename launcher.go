package main

import (
	"math"
	"time"
)

type Launcher struct {
	Keys
	weapon *Weapon

	pressed bool
	space SpaceType
	state PartStateType

	maxAmmo int
	ammo int
	ammoTimer Timer
	reloadTimer Timer

	projectileSize Vec2
	projectileRelativeSpeed bool
	projectileDeleteOnRelease bool
	projectileVel float64
	projectileAcc float64
	projectileJerk float64
	projectileLimit int
	projectileNumber int
	projectileSpread float64

	chargedSize Vec2
	chargedVel float64

	currentProjectiles map[SpacedId]bool
}

func NewLauncher(weapon *Weapon, space SpaceType) *Launcher {
	l := &Launcher {
		weapon: weapon,
		pressed: false,
		space: space,
		state: unknownPartState,

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
		projectileNumber: 1,
		projectileSpread: 0,

		chargedSize: NewVec2(0, 0),
		chargedVel: 0,

		currentProjectiles: make(map[SpacedId]bool),
	}

	switch space {
	case pelletSpace:
		l.maxAmmo = 2
		l.ammoTimer.SetDuration(200 * time.Millisecond)
		l.reloadTimer.SetDuration(800 * time.Millisecond)
		l.projectileSize = NewVec2(0.2, 0.2)
		l.projectileVel = 30
		l.projectileNumber = 4
		l.projectileSpread = 0.025 * math.Pi
	case boltSpace:
		l.maxAmmo = 3
		l.ammoTimer.SetDuration(100 * time.Millisecond)
		l.reloadTimer.SetDuration(400 * time.Millisecond)
		l.projectileSize = NewVec2(0.5, 0.15)
		l.projectileVel = 30
		l.chargedSize = NewVec2(0.6, 0.25)
		l.chargedVel = 45
	case rocketSpace:
		l.maxAmmo = 1
		l.reloadTimer.SetDuration(1000 * time.Millisecond)
		l.projectileSize = NewVec2(0.5, 0.5)
		l.projectileVel = 5
		l.projectileRelativeSpeed = true
		l.projectileAcc = 50
	case starSpace:
		l.maxAmmo = 4
		l.ammoTimer.SetDuration(125 * time.Millisecond)
		l.reloadTimer.SetDuration(700 * time.Millisecond)
		l.projectileVel = 25
		l.projectileSize = NewVec2(0.3, 0.3)
	case grapplingHookSpace:
		l.maxAmmo = 1
		l.reloadTimer.SetDuration(1000 * time.Millisecond)
		l.projectileSize = NewVec2(0.3, 0.3)
		l.projectileDeleteOnRelease = true
		l.projectileVel = 30
		l.projectileLimit = 1
	}
	l.Reload()
	return l
}

func (l Launcher) State() PartStateType { return l.state }

func (l *Launcher) SetPressed(pressed bool) { l.pressed = pressed }
func (l *Launcher) Reload() { l.ammo = l.maxAmmo }

func (l *Launcher) Update(grid *Grid, now time.Time) {
	if l.ammo > 0 && (l.pressed || l.ammo < l.maxAmmo) {
		if l.ammoTimer.On() {
			l.state = rechargingPartState
			return
		}

		if l.weapon.HasAttribute(chargingAttribute) {
			l.state = rechargingPartState
			return			
		}

		l.state = activePartState
		l.Shoot(grid, now)

		if l.weapon.HasAttribute(chargedAttribute) {
			l.weapon.RemoveAttribute(chargedAttribute)
		}
		return
	}

	if l.projectileDeleteOnRelease {
		if !l.pressed {
			l.deleteTrackedProjectiles(grid)
			l.Reload()
			l.state = readyPartState
			return
		} else {
			l.state = activePartState
			return
		}
	} else if l.ammo == 0 {
		if l.reloadTimer.On() {
			l.state = rechargingPartState
			return
		} else {
			l.Reload()
			l.state = readyPartState
			return
		}
	}

	l.state = readyPartState
}

func (l *Launcher) Shoot(grid *Grid, now time.Time) {
	if l.projectileLimit > 0 && len(l.currentProjectiles) >= l.projectileLimit {
		for sid, _ := range(l.currentProjectiles) {
			if !grid.Has(sid) {
				delete(l.currentProjectiles, sid)
			}
		}

		if len(l.currentProjectiles) >= l.projectileLimit {
			return
		}
	}

	l.ammo -= 1

	charged := l.weapon.HasAttribute(chargedAttribute)
	if charged {
		l.ammo = 0
	}
	l.ammoTimer.Start()
	l.reloadTimer.Start()

	if isWasm {
		return
	}

	for i := 0; i < l.projectileNumber; i += 1 {
		size := l.projectileSize
		if charged {
			size = l.chargedSize
		}
		owner := grid.Get(l.weapon.GetOwner())

		init := NewInit(grid.NextSpacedId(l.space), l.weapon.GetShotOrigin(), size)
		projectile := grid.New(init)

		if owner != nil {
			projectile.SetOwner(owner.GetSpacedId())
			overlapOptions := projectile.GetOverlapOptions()
			overlapOptions.SetIds(false, owner.GetSpacedId())
			projectile.SetOverlapOptions(overlapOptions)

			if l.space != grapplingHookSpace {
				if team, ok := owner.GetByteAttribute(teamByteAttribute); ok && team > 0 {
					projectile.SetByteAttribute(teamByteAttribute, team)
					overlapOptions := projectile.GetOverlapOptions()
					overlapOptions.ExcludeByteAttributes(teamByteAttribute, team)
					projectile.SetOverlapOptions(overlapOptions)
				}
			}
		}

		dir := l.weapon.Dir()
		if l.projectileSpread > 0 {
			mult := float64(i - l.projectileNumber) + 0.5 * float64(l.projectileNumber + 1)
			dir.Rotate(mult * l.projectileSpread)
		}
		projectile.SetInitDir(dir)

		if charged {
			projectile.AddAttribute(chargedAttribute)
		}

		vel := dir
		if charged {
			vel.Scale(l.chargedVel)
		} else {
			vel.Scale(l.projectileVel)
		}

		if l.projectileRelativeSpeed {
			if owner != nil {
				addedVel := l.weapon.Dir()
				addedVel.Scale(Max(1, Abs(addedVel.Dot(owner.Vel()))))
				vel.Add(addedVel, 1.0)
			}
		}
		projectile.SetVel(vel)

		acc := l.weapon.Dir()
		acc.Scale(l.projectileAcc)
		projectile.SetAcc(acc)

		jerk := l.weapon.Dir()
		jerk.Scale(l.projectileJerk)
		projectile.SetJerk(jerk)

		grid.Upsert(projectile)

		// Note: tracking only works for 1 projectile
		if l.projectileLimit > 0 {
			l.currentProjectiles[projectile.GetSpacedId()] = true
		}
	}
}

func (l *Launcher) OnDelete(grid *Grid) {
	l.deleteTrackedProjectiles(grid)
}

func (l *Launcher) deleteTrackedProjectiles(grid *Grid) {
	for sid, _ := range(l.currentProjectiles) {
		grid.Delete(sid)
	}
}