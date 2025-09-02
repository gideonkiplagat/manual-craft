import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface ManualGeneratorProps {
  recordingId?: string;
  onGenerateManual?: (role: string, format: string) => Promise<void> | void;
}

const roles = [
  {
    value: 'BA',
    label: 'Business Analyst',
    description: 'Use-case-oriented guides and business rules'
  },
  {
    value: 'QA',
    label: 'Quality Engineer',
    description: 'Test steps, validations, and assertions'
  },
  {
    value: 'Developer',
    label: 'Developer',
    description: 'Technical flow and system-level documentation'
  }
];

const formats = [
  { value: 'PDF', label: 'PDF 📄' },
  { value: 'Docx', label: 'word 📝' },
  { value: 'Excel', label: 'Excel 📊' }
];

const ManualGenerator: React.FC<ManualGeneratorProps> = ({ recordingId, onGenerateManual }) => {
  const { id: routeRecordingId } = useParams<{ id: string }>();
  const resolvedRecordingId = recordingId || routeRecordingId;

  const [role, setRole] = useState<string>('BA');
  const [format, setFormat] = useState<string>('PDF');
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!resolvedRecordingId) {
      setStatusMessage('❌ Recording ID is missing.');
      return;
    }

    setGenerating(true);
    setStatusMessage(null);

    try {
      if (onGenerateManual) {
        await onGenerateManual(role, format);
        setStatusMessage('✅ Manual generated successfully.');
      } else {
        const token = localStorage.getItem("token");
        const exportFormat = format.toLowerCase();

        const res = await fetch(`/api/manuals/generate/${resolvedRecordingId}?format=${exportFormat}&include_screenshots=${includeScreenshots}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData?.error || 'Failed to generate manual');
        }

        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
        const filename = filenameMatch ? filenameMatch[1] : `manual.${exportFormat}`;
        


        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setStatusMessage(`✅ Manual downloaded: ${filename}`);
      }
    } catch (error) {
      console.error('Error generating manual:', error);
      setStatusMessage('❌ Failed to generate manual.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <Label>Choose Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Choose Format</Label>
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {formats.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Include Screenshots</Label>
        <input
          type="checkbox"
          checked={includeScreenshots}
          onChange={() => setIncludeScreenshots(!includeScreenshots)}
          className="accent-blue-500"
        />
      </div>

      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : 'Generate Manual'}
      </Button>

      {statusMessage && <p className="text-sm mt-2">{statusMessage}</p>}
    </Card>
  );
};

export default ManualGenerator;
