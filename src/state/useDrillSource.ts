import { useCallback, useEffect, useState } from "react";
import { Move, type Drill } from "../fgc/types";
import { parser, ParseError } from "../fgc/parser";

const LS_KEY = "fgc.source";

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
    const [sourceText, setSourceText] = useState<string | null>(null);
    const [defaultText, setDefaultText] = useState("");
    const [parseError, setParseError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/fgc_files/ggst.fgc")
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load ggst.fgc (${res.status})`);
                return res.text();
            })
            .then((text) => {
                setDefaultText(text);
                const saved = localStorage.getItem(LS_KEY);
                const initial = saved ?? text;
                setSourceText(initial);
                try {
                    const result = loadDrills(initial);
                    setDrills(result.drills);
                    setButtonNames(result.buttonNames);
                    setParseError(null);
                } catch (err) {
                    setParseError(formatError(err));
                    const result = loadDrills(text);
                    setDrills(result.drills);
                    setButtonNames(result.buttonNames);
                }
            })
            .catch((err) => setError(String(err)));
    }, []);

    const onTextChange = useCallback((text: string) => {
        setSourceText(text);
        localStorage.setItem(LS_KEY, text);
    }, []);

    const onApply = useCallback(() => {
        if (sourceText === null) return;
        try {
            const result = loadDrills(sourceText);
            setDrills(result.drills);
            setButtonNames(result.buttonNames);
            setParseError(null);
        } catch (err) {
            setParseError(formatError(err));
        }
    }, [sourceText]);

    const onDownload = useCallback(() => {
        if (sourceText === null) return;
        const blob = new Blob([sourceText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ggst.fgc";
        a.click();
        URL.revokeObjectURL(url);
    }, [sourceText]);

    const onImport = useCallback((file: File) => {
        file
            .text()
            .then((text) => {
                setSourceText(text);
                localStorage.setItem(LS_KEY, text);
            })
            .catch((err) => setParseError(formatError(err)));
    }, []);

    const onReset = useCallback(() => {
        setSourceText(defaultText);
        localStorage.removeItem(LS_KEY);
        const result = loadDrills(defaultText);
        setDrills(result.drills);
        setButtonNames(result.buttonNames);
        setParseError(null);
    }, [defaultText]);

    return {
        drills,
        buttonNames,
        sourceText,
        defaultText,
        parseError,
        error,
        onTextChange,
        onApply,
        onDownload,
        onImport,
        onReset,
    };
}
