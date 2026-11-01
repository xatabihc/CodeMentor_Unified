package com.codementor.offline;

import java.util.Arrays;

public final class SafeAreaTest {
    private static void equal(int[] expected, int[] actual) {
        if (!Arrays.equals(expected, actual)) {
            throw new AssertionError(Arrays.toString(expected) + " != " + Arrays.toString(actual));
        }
    }
    public static void main(String[] args) {
        for (int width : new int[]{360, 390, 412}) {
            // Unfitted legacy window versus an already fitted content view.
            equal(new int[]{0, 32, 0, 24}, SafeArea.padding(0, 0, width, 800, 0, 32, width, 776));
            equal(new int[]{0, 0, 0, 0}, SafeArea.padding(0, 32, width, 744, 0, 32, width, 776));
            // IME overlap versus decor already resized above the keyboard.
            equal(new int[]{0, 32, 0, 320}, SafeArea.padding(0, 0, width, 800, 0, 32, width, 480));
            equal(new int[]{0, 0, 0, 0}, SafeArea.padding(0, 32, width, 448, 0, 32, width, 480));
            // Tall cutout; repeat dispatch uses absolute values, not cumulative padding.
            for (int repeat=0; repeat<3; repeat++) {
                equal(new int[]{0, 48, 0, 24}, SafeArea.padding(0, 0, width, 800, 0, 48, width, 776));
            }
            equal(new int[]{0, 0, 0, 0}, SafeArea.padding(0, 0, width, 800, 0, 0, width, 800));
        }
        equal(new int[]{44, 24, 20, 16}, SafeArea.padding(0, 0, 844, 390, 44, 24, 824, 374));
        equal(new int[]{0, 0, 0, 0}, SafeArea.padding(44, 24, 780, 350, 44, 24, 824, 374));
        equal(new int[]{0, 0, 0, 0}, SafeArea.padding(0, 0, 0, 0, 0, 48, 390, 800));
        System.out.println("PASS native safe-area geometry: 360/390/412, cutout, rotation, IME, no double inset");
    }
}
