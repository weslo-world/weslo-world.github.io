const TIMER_SECONDS = 10;

export class QuizOverlayScene extends Phaser.Scene {
  constructor() {
    super('QuizOverlay');
  }

  init(data) {
    this.task = data.task;
    this.linesCleared = data.linesCleared || 1;
    this.isRescue = data.isRescue || false;
    this.totalPoints = this.task.points * this.linesCleared;
    this._typed = '';
    this._answerDigits = String(this.task.answer).length;
    this._answered = false;
    this._elapsed = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    const cardW = Math.min(W - 24, 400);
    const cardH = Math.min(H * 0.84, 560);
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);

    // Dim overlay
    this.add.rectangle(cx, cy, W, H, 0x000000, 0.72);

    // Card
    this.add.rectangle(cx, cy, cardW, cardH, 0x1a1a3a)
      .setStrokeStyle(3, 0x5566ff);

    // Points / rescue label
    const labelText = this.isRescue ? 'Rescue Blast!' : `+${this.totalPoints} pts`;
    this.add.text(cx, cy - cardH / 2 + 24, labelText, {
      fontSize: this._fs(18, cardW), fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Problem: "7  ×  8  ="
    this.add.text(cx, cy - cardH / 2 + 68, `${this.task.a}  ×  ${this.task.b}  =`, {
      fontSize: this._fs(38, cardW), fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Answer display boxes
    const boxSize = Math.floor(cardW * 0.18);
    const boxGap = Math.floor(cardW * 0.04);
    const totalBoxW = this._answerDigits * boxSize + (this._answerDigits - 1) * boxGap;
    const boxY = cy - cardH / 2 + 128;

    this._digitBoxes = [];
    for (let i = 0; i < this._answerDigits; i++) {
      const bx = cx - totalBoxW / 2 + i * (boxSize + boxGap) + boxSize / 2;
      const bg = this.add.rectangle(bx, boxY, boxSize, boxSize, 0x2a2a5a)
        .setStrokeStyle(2, 0x8899ff);
      const txt = this.add.text(bx, boxY, '', {
        fontSize: this._fs(34, cardW), fontFamily: 'Arial',
        color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this._digitBoxes.push({ bg, txt });
    }

    // Numpad
    this._buildNumpad(cx, cy, cardW, cardH);

    // Timer bar
    const barY = cy + cardH / 2 - 22;
    const barW = cardW - 40;
    this.add.rectangle(cx, barY, barW, 10, 0x222244);
    this.timerBarFill = this.add.rectangle(cx - barW / 2, barY, barW, 10, 0x44aaff)
      .setOrigin(0, 0.5);
    this._timerBarW = barW;
    this._timerBarX = cx - barW / 2;

    // Confetti emitter (fires on correct)
    this._createConfettiEmitter(W);
  }

  update(time, delta) {
    if (this._answered) return;
    this._elapsed += delta;
    const fraction = Math.max(0, 1 - this._elapsed / (TIMER_SECONDS * 1000));
    this.timerBarFill.width = this._timerBarW * fraction;
    if (fraction < 0.3) this.timerBarFill.setFillStyle(0xff4444);
    else if (fraction < 0.6) this.timerBarFill.setFillStyle(0xffaa00);
    if (fraction <= 0) this._evaluate();
  }

  // ─── Numpad ───────────────────────────────────────────────────────────────

  _buildNumpad(cx, cy, cardW, cardH) {
    const keys = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['AC', 0, '⌫'],
    ];

    const numpadTop = cy - cardH / 2 + 178;
    const btnW = Math.floor(cardW * 0.27);
    const btnH = Math.floor(cardH * 0.105);
    const colGap = Math.floor((cardW - btnW * 3) / 4);
    const rowGap = Math.floor(cardH * 0.015);

    keys.forEach((row, ri) => {
      row.forEach((key, ci) => {
        if (key === null) return;
        const bx = cx - cardW / 2 + colGap + ci * (btnW + colGap) + btnW / 2;
        const by = numpadTop + ri * (btnH + rowGap) + btnH / 2;

        const isSpecial = key === '⌫' || key === 'AC';
        const bg = this.add.rectangle(bx, by, btnW, btnH, isSpecial ? 0x442222 : 0x2a3a6a)
          .setStrokeStyle(2, isSpecial ? 0xaa4444 : 0x5566bb)
          .setInteractive({ useHandCursor: true });

        const label = this.add.text(bx, by, String(key), {
          fontSize: this._fs(isSpecial ? 20 : 28, cardW),
          fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(isSpecial ? 0x663333 : 0x3a4e8a));
        bg.on('pointerout', () => bg.setFillStyle(isSpecial ? 0x442222 : 0x2a3a6a));
        bg.on('pointerdown', () => bg.setFillStyle(isSpecial ? 0x882222 : 0x5566cc));
        bg.on('pointerup', () => {
          bg.setFillStyle(isSpecial ? 0x442222 : 0x2a3a6a);
          if (key === '⌫') this._onBackspace();
          else if (key === 'AC') this._onClear();
          else this._onDigit(key);
        });
      });
    });
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  _onDigit(d) {
    if (this._answered || this._typed.length >= this._answerDigits) return;
    this._typed += String(d);
    this._updateDisplay();
    if (this._typed.length === this._answerDigits) {
      this.time.delayedCall(120, () => this._evaluate());
    }
  }

  _onBackspace() {
    if (this._answered) return;
    this._typed = this._typed.slice(0, -1);
    this._updateDisplay();
  }

  _onClear() {
    if (this._answered) return;
    this._typed = '';
    this._updateDisplay();
  }

  _updateDisplay(overrideDigits, color) {
    const digits = overrideDigits || this._typed;
    this._digitBoxes.forEach((box, i) => {
      const ch = digits[i] || '';
      box.txt.setText(ch);
      box.txt.setColor(color || '#ffffff');
      box.bg.setStrokeStyle(2, ch ? 0xffffff : 0x8899ff);
    });
  }

  // ─── Evaluate ─────────────────────────────────────────────────────────────

  _evaluate() {
    if (this._answered) return;
    this._answered = true;

    const typed = parseInt(this._typed || '0', 10);
    const correct = typed === this.task.answer;

    if (correct) {
      this._updateDisplay(String(this.task.answer), '#7fff7f');
      this._digitBoxes.forEach(b => b.bg.setFillStyle(0x1a4a2a).setStrokeStyle(2, 0x44ee66));
      this.timerBarFill.setFillStyle(0x22aa44);
      this._emitConfetti();

      const W = this.scale.width;
      const H = this.scale.height;
      const resultMsg = this.isRescue ? 'Correct!  Blast!' : `Correct!  +${this.totalPoints} pts`;
      this.add.text(W / 2, H / 2 + 30, resultMsg, {
        fontSize: this._fs(22, Math.min(W - 24, 400)),
        fontFamily: 'Arial', color: '#7fff7f', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.time.delayedCall(1600, () => this._finish(true));
    } else {
      this.cameras.main.shake(400, 0.015);
      this._updateDisplay(this._typed, '#ff8888');
      this._digitBoxes.forEach(b => b.bg.setFillStyle(0x4a1a1a).setStrokeStyle(2, 0xee4444));

      // Show correct answer after shake
      this.time.delayedCall(500, () => {
        this._updateDisplay(String(this.task.answer), '#7fff7f');
        this._digitBoxes.forEach(b => b.bg.setFillStyle(0x1a4a2a).setStrokeStyle(2, 0x44ee66));
      });

      // Dismiss after 10s or tap
      this.time.delayedCall(10000, () => this._finish(false));
      this.time.delayedCall(500, () => {
        this.input.once('pointerdown', () => this._finish(false));
      });
    }
  }

  _finish(correct) {
    this.events.emit('quizComplete', { correct, points: correct ? this.totalPoints : 0 });
    this.scene.stop();
  }

  // ─── Confetti ─────────────────────────────────────────────────────────────

  _createConfettiEmitter(W) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 10, 6);
    g.generateTexture('confetti_particle', 10, 6);
    g.destroy();

    const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff922b, 0xcc5de8];
    this._confettiEmitters = colors.map(tint =>
      this.add.particles(0, 0, 'confetti_particle', {
        x: { min: 0, max: W },
        y: { start: -20, end: this.scale.height + 20 },
        speedY: { min: 300, max: 600 },
        speedX: { min: -80, max: 80 },
        rotate: { start: 0, end: 360 },
        lifespan: 2200,
        quantity: 2,
        tint,
        emitting: false,
      })
    );
  }

  _emitConfetti() {
    for (const emitter of this._confettiEmitters) {
      emitter.start();
      this.time.delayedCall(800, () => emitter.stop());
    }
  }

  _fs(base, cardW) {
    return `${Math.floor(base * (cardW / 360))}px`;
  }
}
