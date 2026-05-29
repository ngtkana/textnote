// スワイプジェスチャー検出

export interface SwipeEvent {
  direction: 'left' | 'right';
  distance: number;
}

export type SwipeCallback = (event: SwipeEvent) => void;

export class SwipeDetector {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isSwiping = false;
  private element: HTMLElement;
  private onSwipe: SwipeCallback;

  private readonly threshold = 50; // 最小スワイプ距離（px）
  private readonly maxTime = 300; // 最大スワイプ時間（ms）
  private readonly restraint = 100; // 垂直方向の最大許容距離（px）

  constructor(element: HTMLElement, onSwipe: SwipeCallback) {
    this.element = element;
    this.onSwipe = onSwipe;
    this.attachListeners();
  }

  private attachListeners(): void {
    // タッチイベント
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: true,
    });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // マウスイベント（デスクトップでのテスト用）
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isSwiping = true;
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isSwiping) return;

    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - this.startY);

    // 垂直方向のスクロールと判定したらスワイプキャンセル
    if (deltaY > this.restraint) {
      this.isSwiping = false;
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isSwiping) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = Math.abs(touch.clientY - this.startY);
    const deltaTime = Date.now() - this.startTime;

    this.isSwiping = false;

    // スワイプ判定
    if (
      Math.abs(deltaX) >= this.threshold &&
      deltaY <= this.restraint &&
      deltaTime <= this.maxTime
    ) {
      this.onSwipe({
        direction: deltaX > 0 ? 'right' : 'left',
        distance: Math.abs(deltaX),
      });
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTime = Date.now();
    this.isSwiping = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isSwiping) return;

    const deltaY = Math.abs(e.clientY - this.startY);

    if (deltaY > this.restraint) {
      this.isSwiping = false;
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.isSwiping) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = Math.abs(e.clientY - this.startY);
    const deltaTime = Date.now() - this.startTime;

    this.isSwiping = false;

    if (
      Math.abs(deltaX) >= this.threshold &&
      deltaY <= this.restraint &&
      deltaTime <= this.maxTime
    ) {
      this.onSwipe({
        direction: deltaX > 0 ? 'right' : 'left',
        distance: Math.abs(deltaX),
      });
    }
  }

  private handleMouseLeave(): void {
    this.isSwiping = false;
  }

  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}
