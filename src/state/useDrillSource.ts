import { useCallback, useEffect, useRef, useState } from "react";
import { Move, type Drill } from "../fgc/types";
import { parser, ParseError } from "../fgc/parser";

const LS_KEY = "fgc.source";
const LS_FILE = "fgc.lastFile";
const MANIFEST_URL = "/fgc_files/manifest.json";

const sourceKey = (name: string) => `${LS_KEY}.${name}`;

function loadDrills(text: string): { drills: Drill[]; buttonNames: Record<number, string> } {
    const { defs, buttonNames } = parser(text);
    const drills: Drill[] = [];
    for (const [name, var_] of Object.entries(defs)) {
        if (var_ instanceof Move) {
            drills.push({
                name: name
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
                move: var_,
                count: 0,
                combo: 0,
                missed: false,
                attempts: 0,
                firstInputFrames: 0,
                allFrames: 0,
                totalFirstInputFrames: 0,
                totalFrames: 0,
                lastMissed: false,
            });
        }
    }
    return { drills, buttonNames };
}

function formatError(err: unknown): string {
    if (err instanceof ParseError) return `Line ${err.line}: ${err.message}`;
    return String(err);
}

export function useDrillSource() {
    const [drills, setDrills] = useState<Drill[] | null>(null);
    const [buttonNames, setButtonNames] = useState<Record<number, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [text, setText] = useState("");
    const [parseError, setParseError] = useState<string | null>(null);

    const textsRef = useRef<Record<string, string>>({});
    const defaultsRef = useRef<Record<string, string>>({});

    const parse = useCallback((text: string) => {
        try {
            const result = loadDrills(text);
            setDrills(result.drills);
            setButtonNames(result.buttonNames);
            setParseError(null);
        } catch (err) {
            setParseError(formatError(err));
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetch(MANIFEST_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load ${MANIFEST_URL} (${res.status})`);
                return res.json() as Promise<string[]>;
            })
            .then(async (names) => {
                const texts: Record<string, string> = {};
                const defaults: Record<string, string> = {};
                for (const name of names) {
                    const res = await fetch(`/fgc_files/${name}`);
                    if (!res.ok) throw new Error(`Failed to load ${name} (${res.status})`);
                    const defaultText = await res.text();
                    defaults[name] = defaultText;
                    texts[name] = localStorage.getItem(sourceKey(name)) ?? defaultText;
                }
                if (cancelled) return;
                textsRef.current = texts;
                defaultsRef.current = defaults;
                setFileNames(names);
                const last = localStorage.getItem(LS_FILE);
                const initial = last && names.includes(last) ? last : names[0];
                setCurrentFile(initial);
                setText(texts[initial]);
                parse(texts[initial]);
            })
            .catch((err) => setError(String(err)));
        return () => {
            cancelled = true;
        };
    }, [parse]);

    const onSelectFile = useCallback(
        (name: string) => {
            if (name === currentFile) return;
            setCurrentFile(name);
            localStorage.setItem(LS_FILE, name);
            const t = textsRef.current[name];
            setText(t);
            parse(t);
        },
        [currentFile, parse],
    );

    const onTextChange = useCallback(
        (text: string) => {
            if (currentFile === null) return;
            setText(text);
            textsRef.current[currentFile] = text;
            localStorage.setItem(sourceKey(currentFile), text);
        },
        [currentFile],
    );

    const onApply = useCallback(() => {
        if (currentFile === null) return;
        parse(textsRef.current[currentFile]);
    }, [currentFile, parse]);

    const onDownload = useCallback(() => {
        if (currentFile === null) return;
        const blob = new Blob([textsRef.current[currentFile]], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = currentFile;
        a.click();
        URL.revokeObjectURL(url);
    }, [currentFile]);

    const onImport = useCallback(
        (file: File) => {
            if (currentFile === null) return;
            file
                .text()
                .then((text) => {
                    textsRef.current[currentFile] = text;
                    setText(text);
                    localStorage.setItem(sourceKey(currentFile), text);
                })
                .catch((err) => setParseError(formatError(err)));
        },
        [currentFile],
    );

    const onReset = useCallback(() => {
        if (currentFile === null) return;
        const defaultText = defaultsRef.current[currentFile];
        textsRef.current[currentFile] = defaultText;
        localStorage.removeItem(sourceKey(currentFile));
        setText(defaultText);
        parse(defaultText);
    }, [currentFile, parse]);

    return {
        drills,
        buttonNames,
        text,
        fileNames,
        currentFile,
        parseError,
        error,
        onTextChange,
        onApply,
        onDownload,
        onImport,
        onReset,
        onSelectFile,
    };
}
