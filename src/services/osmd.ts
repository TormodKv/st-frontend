import { BasicAudioPlayer, ControlPanel, IAudioMetronomePlayer, IMessageViewer, LinearTimingSource, OpenSheetMusicDisplay, PlaybackManager, TransposeCalculator } from "@/assets/js/osmd";
import { SheetMusicOptions } from "@/store/songs";

class OSMD {
    private osmd: OpenSheetMusicDisplay = {} as OpenSheetMusicDisplay;
    public canvas: HTMLElement = {} as HTMLElement;
    public pbcanvas: HTMLElement = {} as HTMLElement;
    public originalKey?: string;
    public transposition = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private initialZoom?: number;
    public zoom = 1;
    public createdDone = false;
    public loading: string[] = [];

    private controlPanel: ControlPanel = {} as ControlPanel;
    private timingSource = new LinearTimingSource();
    private playbackManager = () => new PlaybackManager(this.timingSource, undefined as unknown as IAudioMetronomePlayer, new BasicAudioPlayer(), undefined as unknown as IMessageViewer);

    constructor() {
        this.zoom = this.initialZoom != undefined ? this.initialZoom : window.innerWidth < 900 ? 0.4 : this.zoom;
        
        const canvas = document.getElementById("osmd-canvas");
        const pbcanvas = document.getElementById("pb-controls");

        this.init(canvas, pbcanvas);
    }

    public async init(canvas: HTMLElement | null, pbcanvas: HTMLElement | null) {
        while(!canvas || !pbcanvas) {
            canvas = document.getElementById("osmd-canvas");
            pbcanvas = document.getElementById("pb-controls");

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (canvas && pbcanvas) {
            this.canvas = canvas;
            this.pbcanvas = pbcanvas;
            
            this.osmd = new OpenSheetMusicDisplay(this.canvas, {
                autoResize: true,
                backend: "canvas",
                drawingParameters: "default", // try compact (instead of default)
                drawPartNames: false, // try false
                drawTitle: false,
                drawSubtitle: false,
                disableCursor: false,
                // fingeringInsideStafflines: "true", // default: false. true draws fingerings directly above/below notes
                setWantedStemDirectionByXml: false, // try false, which was previously the default behavior
                // drawUpToMeasureNumber: 3, // draws only up to measure 3, meaning it draws measure 1 to 3 of the piece.
                drawUpToMeasureNumber: Number.MAX_SAFE_INTEGER,
                drawFromMeasureNumber: 0,

                //drawMeasureNumbers: false, // disable drawing measure numbers
                //measureNumberInterval: 4, // draw measure numbers only every 4 bars (and at the beginning of a new system)
                useXMLMeasureNumbers: true, // read measure numbers from xml

                // coloring options
                //coloringEnabled: true,
                // defaultColorNotehead: "#CC0055", // try setting a default color. default is black (undefined)
                // defaultColorStem: "#BB0099",
                defaultFontFamily: "Inter",

                // autoBeam: false, // try true, OSMD Function Test AutoBeam sample
                // autoBeamOptions: {
                //     // eslint-disable-next-line @typescript-eslint/camelcase
                //     beam_rests: false,
                //     // eslint-disable-next-line @typescript-eslint/camelcase
                //     beam_middle_rests_only: false,
                //     //groups: [[3,4], [1,1]],
                //     // eslint-disable-next-line @typescript-eslint/camelcase
                //     maintain_stem_directions: false
                // },
                pageBackgroundColor: "#FFFFFF",
            });

            this.controlPanel = new ControlPanel(pbcanvas);

            const o = this.osmd;

            const playbackListener = {
                play() {
                    o.cursor.cursorElement.style.zIndex = "100";
                    o.FollowCursor = true;
                },
                pause() {
                    console.log("pause");
                },
                reset() {
                    console.log("reset");},
                bpmChanged() {
                    console.log("bpm");},
                volumeChanged() {
                    console.log("volume");},
                volumeMute() {
                    console.log("volume");},
                volumeUnmute() {
                    console.log("volume");}
            }

            this.controlPanel.addListener(playbackListener);

        } else {
            throw new Error("Couldn't get the canvas for OSMD")
        }
    }

    public async load(sheetMusic: SheetMusicOptions) {
        if (!sheetMusic.url) throw new Error("URL not found. Aborting load");

        this.transposition = sheetMusic.transposition ?? 0;

        this.canvas.innerHTML = "";
        this.pbcanvas.innerHTML = "";

        this.osmd.setLogLevel("warn");

        await this.osmd.load(sheetMusic.url);

        this.osmd.TransposeCalculator = new TransposeCalculator();

        this.osmd.Sheet.Transpose = this.transposition;

        this.osmd.updateGraphic();

        this.osmd.zoom = this.zoom;

        this.osmd.render();
        
        this.osmd.enableOrDisableCursor(true);
        
        // this.osmd.cursor.reset();

        this.loadPlaybackManager();

        // this.playbackControl.initialize();
    }

    public rerender() {
        this.disable();
        if (this.osmd?.IsReadyToRender()) {
            this.osmd.zoom = this.zoom;
            this.osmd.render();
            this.osmd.enableOrDisableCursor(true);
            this.osmd.cursor.cursorElement.style.zIndex = "100";
        }
        this.enable();
    }

    public disable() {
        this.canvas.style.opacity = "0.4";
    }

    public enable() {
        this.canvas.style.opacity = "";
    }

    public transpose(n: number) {
        this.transposition = n;

        this.osmd.Sheet.Transpose = this.transposition;

        this.osmd.updateGraphic();

        this.osmd.enableOrDisableCursor(true);

        this.osmd.cursor.cursorElement.style.zIndex = "100";
        
        this.rerender();
    }

    public showControls() {
        this.controlPanel.show();
    }

    public hideControls() {
        this.controlPanel.hideAndClear();
    }

    public clear() {
        this.hideControls();
        this.controlPanel.clearVolumeTracks();
        this.timingSource.pause();
        this.timingSource.reset();
    }

    private loadPlaybackManager() {
        this.timingSource.reset();
        this.timingSource.pause();
        this.timingSource.Settings = this.osmd.Sheet.SheetPlaybackSetting;
        // this.playbackManager.Dispose();
        this.osmd.PlaybackManager?.Dispose();

        const playbackManager = this.playbackManager();

        playbackManager.DoPlayback = true;
        playbackManager.DoPreCount = false;
        playbackManager.initialize(this.osmd.Sheet.MusicPartManager);
        playbackManager.addListener(this.osmd.cursor);
        playbackManager.reset();
        this.osmd.PlaybackManager = playbackManager;
        this.controlPanel.addListener(playbackManager);
        this.controlPanel.clearVolumeTracks();
        this.controlPanel.addVolumeTrack(playbackManager.Metronome.Name, playbackManager.Metronome.Id, playbackManager.Metronome.Volume*100);
        for(const instrId of playbackManager.InstrumentIdMapping.keys()) {
            const instr = playbackManager.InstrumentIdMapping.getValue(instrId);
            if (!instr) continue;
            this.controlPanel.addVolumeTrack(instr.Name, instrId, instr.Volume * 100);
        }
        this.controlPanel.bpmChanged(this.osmd.Sheet.DefaultStartTempoInBpm);
    }
}

export const osmd = new OSMD();