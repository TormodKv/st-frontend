/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { ITransposeCalculator, Pitch, NoteEnum, AccidentalEnum, KeyInstruction } from "opensheetmusicdisplay";

export class TransposeCalculator implements ITransposeCalculator {
    private static keyMapping: number[] = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5];
    private static noteEnums: NoteEnum[] = [NoteEnum.C, NoteEnum.D, NoteEnum.E, NoteEnum.F, NoteEnum.G, NoteEnum.A, NoteEnum.B];
    public transposePitch(pitch: Pitch, currentKeyInstruction: KeyInstruction, halftones: number): Pitch {

        let transposedFundamentalNote: NoteEnum = NoteEnum.C;
        let transposedOctave = 0;
        let transposedAccidental: AccidentalEnum = AccidentalEnum.NONE;
        const result: { halftone: number; overflow: number } = Pitch.CalculateTransposedHalfTone(pitch, halftones);
        let transposedHalfTone: number = result.halftone;
        let octaveChange: number = result.overflow;

        for (let i = 0; i < TransposeCalculator.noteEnums.length; i++) {
            const currentValue: number = <number>TransposeCalculator.noteEnums[i];
            if (currentValue === transposedHalfTone) {
                const noteIndex: number = i;
                transposedFundamentalNote = TransposeCalculator.noteEnums[noteIndex];
                transposedOctave = <number>(pitch.Octave + octaveChange);
                transposedAccidental = AccidentalEnum.NONE;
                return new Pitch(transposedFundamentalNote, transposedOctave, transposedAccidental);
            } else if (currentValue > transposedHalfTone) {
                break;
            }
        }
        for (let i = 0; i < TransposeCalculator.noteEnums.length; i++) {
            const currentValue: number = <number>TransposeCalculator.noteEnums[i];
            if (currentValue > transposedHalfTone) {
                let noteIndex: number = i;
                const accidentalHalfTones: number = Pitch.HalfTonesFromAccidental(pitch.Accidental);

                if (accidentalHalfTones > 0 || (accidentalHalfTones === 0 && currentKeyInstruction.Key >= 0)) {
                    noteIndex--;
                }
                while (noteIndex < 0) {
                    noteIndex += 7;
                    transposedHalfTone += 12;
                    octaveChange--;
                }
                while (noteIndex >= 7) {
                    noteIndex -= 7;
                    transposedHalfTone -= 12;
                    octaveChange++;
                }
                transposedFundamentalNote = TransposeCalculator.noteEnums[noteIndex];
                transposedAccidental = Pitch.AccidentalFromHalfTones(transposedHalfTone - <number>transposedFundamentalNote);
                transposedOctave = <number>(pitch.Octave + octaveChange);
                break;
            }
        }

        const transposedPitch: Pitch = new Pitch(transposedFundamentalNote, transposedOctave, transposedAccidental);
        return transposedPitch;
    }
    public transposeKey(keyInstruction: KeyInstruction, transpose: number): void {
        let currentIndex = 0;
        let previousKeyType = 0;
        for (; currentIndex < TransposeCalculator.keyMapping.length; currentIndex++) {
            previousKeyType = TransposeCalculator.keyMapping[currentIndex];
            if (previousKeyType === keyInstruction.keyTypeOriginal) {
                break;
            }
        }
        let newIndex: number = (currentIndex + transpose);
        while (newIndex >= 12) {
            newIndex -= 12;
        }
        while (newIndex < 0) {
            newIndex += 12;
        }
        keyInstruction.Key = TransposeCalculator.keyMapping[newIndex];
        keyInstruction.isTransposedBy = transpose;
    }
}