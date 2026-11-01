package com.codementor.offline;

/** Insets remaining after decor fitting/resizing. Coordinates are screen pixels. */
final class SafeArea {
    private SafeArea() {}

    static int[] padding(int x, int y, int width, int height,
                         int safeLeft, int safeTop, int safeRight, int safeBottom) {
        if (width <= 0 || height <= 0) return new int[]{0, 0, 0, 0};
        return new int[]{
                Math.min(width, Math.max(0, safeLeft - x)),
                Math.min(height, Math.max(0, safeTop - y)),
                Math.min(width, Math.max(0, x + width - safeRight)),
                Math.min(height, Math.max(0, y + height - safeBottom))
        };
    }
}
