import { useState } from "react";
import { Upload, ImagePlus, AlertCircle, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { analyzeDisease, type DiagnosisResponse } from "../services/farmersApi";

const MAX_DISEASE_IMAGE_MB = 8;

/** Resize/compress image so request stays under payload limit (~4.5 MB). Returns data URL. */
async function compressImageForDiseaseDetection(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to load image"));
      i.src = url;
    });
    const maxSize = 1024;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxSize || h > maxSize) {
      if (w > h) {
        h = Math.round((h * maxSize) / w);
        w = maxSize;
      } else {
        w = Math.round((w * maxSize) / h);
        h = maxSize;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function AICropDoctor() {
  const [step, setStep] = useState<"upload" | "loading" | "result" | "error">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, etc.).");
      return;
    }
    if (f.size > MAX_DISEASE_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_DISEASE_IMAGE_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const runAnalysis = async () => {
    if (!file) return;
    setStep("loading");
    setError(null);
    setResult(null);
    try {
      const base64 = await compressImageForDiseaseDetection(file);
      const response = await analyzeDisease(base64);
      setResult(response);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
      setStep("error");
    }
  };

  const resetToUpload = () => {
    setStep("upload");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl w-full min-w-0">
      <div>
        <h2 className="agri-section-header">AI Crop Doctor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo of a diseased crop leaf or plant. Our AI will identify the condition and provide treatment recommendations.
        </p>
      </div>

      {step === "upload" && (
        <Card className="agri-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-emerald-400" />
              Upload crop image
            </CardTitle>
            <CardDescription>
              Take or select a clear photo of the affected area. A close-up of the leaf or affected part works best.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border border-dashed border-emerald-900/50 rounded-xl p-8 sm:p-12 text-center bg-background/40 hover:border-emerald-500/40 transition-colors cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              onClick={() => document.getElementById("crop-doctor-file-input")?.click()}
            >
              <input
                id="crop-doctor-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
                  <p className="text-sm text-foreground">Drag and drop an image, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG up to {MAX_DISEASE_IMAGE_MB} MB
                  </p>
                </>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0"
              disabled={!file}
              onClick={runAnalysis}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "loading" && (
        <Card className="agri-card">
          <CardContent className="pt-6 space-y-6" aria-live="polite">
            <div className="rounded-xl border agri-card bg-background/40 p-4 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-2 w-full rounded" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && result?.diagnosis && (
        <div className="space-y-6">
          <Card className="agri-card">
            <CardHeader>
              <CardTitle className="text-base text-emerald-400">Primary diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-semibold text-foreground">
                {result.diagnosis.primary.name}
              </p>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Confidence</span>
                  <span>{Math.round((result.diagnosis.primary.confidence ?? 0) * 100)}%</span>
                </div>
                <Progress
                  value={(result.diagnosis.primary.confidence ?? 0) * 100}
                  className="h-2 [&>div]:bg-emerald-500"
                />
              </div>
              {result.diagnosis.primary.description && (
                <p className="text-sm text-muted-foreground">
                  {result.diagnosis.primary.description}
                </p>
              )}
            </CardContent>
          </Card>

          {result.diagnosis.alternatives?.length > 0 && (
            <Card className="agri-card">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">Other possibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.diagnosis.alternatives.map((alt, i) => (
                    <li key={i}>
                      {alt.name} ({Math.round(alt.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.diagnosis.recommendations?.length > 0 && (
            <Card className="agri-card">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-foreground list-disc list-inside space-y-1">
                  {result.diagnosis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(result.diagnosis.treatmentSuggestions?.length ?? 0) > 0 && (
            <Card className="agri-card">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">Treatment suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-foreground list-disc list-inside space-y-1">
                  {result.diagnosis.treatmentSuggestions!.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(result.diagnosis.fertilizersOrPesticides?.length ?? 0) > 0 && (
            <Card className="agri-card">
              <CardHeader>
                <CardTitle className="text-base text-emerald-400">
                  Recommended fertilizers / pesticides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {result.diagnosis.fertilizersOrPesticides!.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.disclaimer && (
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
              {result.disclaimer}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="agri-card text-foreground" asChild>
              <Link to="/agriculture/experts">Consult expert</Link>
            </Button>
            <Button variant="outline" className="agri-card text-foreground" onClick={resetToUpload}>
              Upload new image
            </Button>
          </div>
        </div>
      )}

      {step === "error" && (
        <Card className="agri-card">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
            <Button variant="outline" className="agri-card" onClick={resetToUpload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
