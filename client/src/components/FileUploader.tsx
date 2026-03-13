import { useEffect, useState } from "react";

interface FileUploaderProps {
  onChange: (file: File | null) => void;
}

const FileUploader = ({ onChange }: FileUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60">
      <label className="block cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        Upload evidence image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            onChange(file);
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
          }}
        />
      </label>
      {previewUrl ? <img src={previewUrl} alt="Complaint preview" className="mt-4 h-48 w-full rounded-2xl object-cover" /> : null}
    </div>
  );
};

export default FileUploader;
