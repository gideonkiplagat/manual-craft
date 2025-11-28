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
  sessionId?: number | string | null;
  onGenerateManual?: (
    role: string,
    format: string,
    includeScreenshots: boolean,
    recordingIdOverride?: string | null,
    sessionId?: number | string | null
  ) => Promise<void> | void;
}

const roles = [
  { value: 'BA', label: 'Business Analyst' },
  { value: 'QA', label: 'Quality Engineer' },
  { value: 'Developer', label: 'Developer' }
];

const formats = [
  { value: 'PDF', label: 'PDF 📄' },
  { value: 'Docx', label: 'Word 📝' },
  { value: 'Excel', label: 'Excel 📊' }
];

const ManualGenerator: React.FC<ManualGeneratorProps> = ({
  recordingId,
  sessionId,
  onGenerateManual
}) => {
  const { id: routeRecordingId } = useParams<{ id: string }>();
  const resolvedRecordingId = recordingId || routeRecordingId;

  const [role, setRole] = useState<string>('BA');
  const [format, setFormat] = useState<string>('PDF');
  const [includeScreenshots, setIncludeScreenshots] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatusMessage(null);

    try {
      if (onGenerateManual) {
        await onGenerateManual(
          role,
          format,
          includeScreenshots,
          resolvedRecordingId || null,
          sessionId || null
        );
        setStatusMessage('✅ Manual generated successfully.');
      }
    } catch (e) {
      console.error('Error generating manual:', e);
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
