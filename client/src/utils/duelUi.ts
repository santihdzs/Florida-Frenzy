/*
* Manuel Montero, Yael Ordaz & Santiago Hernandez
* 
*
*
*
*/

import Phaser from 'phaser'; // Phaser library for game development
import { MAX_HP, MAX_ENERGY } from './duelConfig'; // constants for maximum HP and energy values

export function updateHpBar( // function that contains the logic for rendering an HP bar based on current HP, with color changes and numeric display
    graphics: Phaser.GameObjects.Graphics,
    hp: number,
    maxHp: number,
    x: number,
    y: number,
    hpText: Phaser.GameObjects.Text
) {
    graphics.clear(); // remove the previous frame's bar
    graphics.fillStyle(0x333333, 0.95); // dark bar background
    graphics.fillRoundedRect(x, y, 240, 20, 8); // draw the bar track

    const safeMax = Math.max(1, maxHp); // prevent division by zero
    const percent = Math.max(0, Math.min(hp, safeMax)) / safeMax; // calculate HP percentage, clamped between 0 and 1
    const ratio = hp / safeMax; // calculate HP ratio for color coding

    const color = ratio > 0.5 ? 0x00ff88 : ratio > 0.25 ? 0xffaa00 : 0xff4444; // choose color based on current HP
    graphics.fillStyle(color, 1); // fill color for the actual HP amount
    graphics.fillRoundedRect(x, y, percent * 240, 20, 8); // clamp and scale HP to the bar width

    graphics.lineStyle(2, 0xffffff, 1); // white border for readability
    graphics.strokeRoundedRect(x, y, 240, 20, 8); // outline the HP bar

    hpText.setText(`${Math.max(0, hp)}/${safeMax} HP`); // show numeric HP value
}

export function updateShieldBar( // function that contains the logic for rendering a shield bar based on current shield value, with color coding and scaling
    graphics: Phaser.GameObjects.Graphics,
    shield: number,
    x: number,
    y: number,
    shieldText: Phaser.GameObjects.Text
) {
    graphics.clear(); // clear previous shield bar
    graphics.fillStyle(0x333333, 0.95); // dark background for the shield bar
    graphics.fillRoundedRect(x, y, 240, 20, 8); // draw the bar track

    const visibleShield = Math.max(0, Math.min(shield, MAX_HP)); // clamp shield to max HP for display
    graphics.fillStyle(0x4db8ff, 1); // bright blue for shield
    graphics.fillRoundedRect(x, y, (visibleShield / MAX_HP) * 240, 20, 8); // draw the shield fill

    graphics.lineStyle(2, 0xffffff, 1); // white border for contrast
    graphics.strokeRoundedRect(x, y, 240, 20, 8); // outline the shield bar

    shieldText.setText(`${Math.max(0, shield)} SH`); // show numeric shield value
}

export function updateEnergyBar( // function that contains the logic for rendering an energy bar based on current energy, with color coding and scaling
    graphics: Phaser.GameObjects.Graphics,
    value: number,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number
) {
    graphics.clear(); // clear previous fill
    graphics.fillStyle(0x2b2b2b, 0.95); // dark background track
    graphics.fillRoundedRect(x, y, width, height, 6); // draw the bar track

    graphics.fillStyle(fillColor, 1); // use the supplied color for energy type
    graphics.fillRoundedRect(x, y, (Math.max(0, Math.min(value, MAX_ENERGY)) / MAX_ENERGY) * width, height, 6); // scale current energy to the bar width

    graphics.lineStyle(2, 0xffffff, 1); // white border
    graphics.strokeRoundedRect(x, y, width, height, 6); // draw the outline
}