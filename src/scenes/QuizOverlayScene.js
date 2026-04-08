import { computeLayout } from '../utils/layout.js';

const TIMER_SECONDS = 10;

export class QuizOverlayScene extends Phaser.Scene {
  constructor() {
    super('QuizOverlay');
  }

  init(data) {
    this.task = data.task;           // { a, b, answer, options, points }
    this.linesCleared = data.linesCleared || 1;
    this.isRescue = data.isRescue || false;
    this.totalPoints = this.task.points * this.linesCleared;
    this._answered = false;
  }

  create() {
    const L = computeLayout(this.scale.width, this.scale.height);

    // Dim overlay
    this.add.rectangle(L.centerX, L.centerY, L.W, L.H, 0x000000, 0.65);

    // Card background
    const card = this.add.rectangle(L.centerX, L.centerY, L.quizW, L.quizH, 0x1e1e3a, 1)
      .setStrokeStyle(3, 0x5566ff);

    // Points label
    const labelText = this.isRescue
      ? 'Rescue Blast!'
      : `+${this.totalPoints} pts`;
    this.add.text(L.centerX, L.centerY - L.quizH / 2 + 22, labelText, {
      fontSize: this._fs(20, L), fontFamily: 'Arial', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Problem text
    this.problemText = this.add.text(
      L.centerX,
      L.centerY - L.quizH / 2 + 70,
      `${this.task.a}  ×  ${this.task.b}  =  ?`,
      { fontSize: this._fs(40, L), fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold' }
    ).setOrigin(0.5);

    // Answer buttons (2×2 grid)
    const btnW = Math.floor(L.quizW * 0.42);
    const btnH = Math.floor(L.quizH * 0.14);
    const btnGap = Math.floor(L.quizW * 0.05);
    const gridTop = L.centerY - 10;
    const positions = [
      [L.centerX - btnW / 2 - btnGap / 2, gridTop - btnH / 2 - btnGap / 2],
      [L.centerX + btnW / 2 + btnGap / 2, gridTop - btnH / 2 - btnGap / 2],
      [L.centerX - btnW / 2 - btnGap / 2, gridTop + btnH / 2 + btnGap / 2],
      [L.centerX + btnW / 2 + btnGap / 2, gridTop + btnH / 2 + btnGap / 2],
    ];

    this.buttons = [];
    this.task.options.forEach((value, i) => {
      const [bx, by] = positions[i];
      const bg = this.add.rectangle(bx, by, btnW, btnH, 0x3344aa, 1)
        .setStrokeStyle(2, 0x8899ff)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(bx, by, String(value), {
        fontSize: this._fs(28, L), fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x5566cc));
      bg.on('pointerout', () => { if (!this._answered) bg.setFillStyle(0x3344aa); });
      bg.on('pointerup', () => this._onAnswer(value, bg, label));
      this.buttons.push({ bg, label, value });
    });

    // Timer bar
    const barY = L.centerY + L.quizH / 2 - 28;
    const barW = L.quizW - 40;
    this.add.rectangle(L.centerX, barY, barW, 14, 0x333366, 1)
      .setStrokeStyle(1, 0x555599);
    this.timerBarFill = this.add.rectangle(
      L.centerX - barW / 2, barY, barW, 14, 0x44aaff, 1
    ).setOrigin(0, 0.5);
    this._timerBarW = barW;
    this._timerBarX = L.centerX - barW / 2;
    this._elapsed = 0;

    // Confetti particles (created but emitting only on correct)
    this._createConfettiEmitter(L);
  }

  update(time, delta) {
    if (this._answered) return;
    this._elapsed += delta;
    const fraction = Math.max(0, 1 - this._elapsed / (TIMER_SECONDS * 1000));
    this.timerBarFill.width = this._timerBarW * fraction;
    this.timerBarFill.x = this._timerBarX;

    // Color shifts red as time runs out
    if (fraction < 0.3) this.timerBarFill.setFillStyle(0xff4444);
    else if (fraction < 0.6) this.timerBarFill.setFillStyle(0xffaa00);

    if (fraction <= 0) this._onAnswer(null, null, null); // timeout = wrong
  }

  _onAnswer(value, bg, label) {
    if (this._answered) return;
    this._answered = true;

    const correct = value === this.task.answer;

    if (correct) {
      bg.setFillStyle(0x22aa44);
      this.timerBarFill.setFillStyle(0x22aa44);
      this._emitConfetti();

      const L = computeLayout(this.scale.width, this.scale.height);
      this.add.text(L.centerX, L.centerY + L.quizH / 2 - 55,
        `Correct!  +${this.totalPoints} pts`, {
          fontSize: this._fs(22, L), fontFamily: 'Arial',
          color: '#7fff7f', fontStyle: 'bold',
        }).setOrigin(0.5);

      this.time.delayedCall(1600, () => this._finish(true));
    } else {
      // Shake the card
      this.cameras.main.shake(400, 0.015);
      if (bg) bg.setFillStyle(0xaa2222);

      // Show correct answer
      const L = computeLayout(this.scale.width, this.scale.height);
      const correctBtn = this.buttons.find(b => b.value === this.task.answer);
      if (correctBtn) correctBtn.bg.setFillStyle(0x22aa44);

      this.add.text(L.centerX, L.centerY + L.quizH / 2 - 55,
        `Answer: ${this.task.answer}`, {
          fontSize: this._fs(22, L), fontFamily: 'Arial',
          color: '#ff8888', fontStyle: 'bold',
        }).setOrigin(0.5);

      // Tap anywhere or wait 5s to dismiss
      this.time.delayedCall(5000, () => this._finish(false));
      this.input.once('pointerup', () => this._finish(false));
    }
  }

  _finish(correct) {
    this.events.emit('quizComplete', { correct, points: correct ? this.totalPoints : 0 });
    this.scene.stop();
  }

  _createConfettiEmitter(L) {
    // Generate a small white texture for particles
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 10, 6);
    g.generateTexture('confetti_particle', 10, 6);
    g.destroy();

    const colors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff922b, 0xcc5de8];
    this._confettiEmitters = colors.map(tint =>
      this.add.particles(0, 0, 'confetti_particle', {
        x: { min: 0, max: L.W },
        y: { start: -20, end: L.H + 20 },
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

  _fs(base, L) {
    // Scale font relative to quiz card width
    return `${Math.floor(base * (L.quizW / 360))}px`;
  }
}
