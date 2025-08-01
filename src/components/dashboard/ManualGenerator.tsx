import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Users, Code, TestTube, Sparkles } from 'lucide-react';

interface ManualGeneratorProps {
  recordingId?: string;
  onGenerateManual?: (role: string, format: string) => void;
}

export const ManualGenerator = ({ recordingId, onGenerateManual }: ManualGeneratorProps) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const roles = [
    {
      value: 'BA',
      label: 'Business Analyst',
      icon: Users,
      description: 'Use-case-oriented guides and business rules',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      value: 'QA',
      label: 'Quality Engineer',
      icon: TestTube,
      description: 'Test steps, validations, and assertions',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      value: 'Developer',
      label: 'Developer',
      icon: Code,
      description: 'Technical flow and system-level documentation',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF Document', icon: '📄' },
    { value: 'docx', label: 'Word Document', icon: '📝' },
    { value: 'xlsx', label: 'Excel Spreadsheet', icon: '📊' }
  ];

  const handleGenerate = async () => {
    if (!selectedRole || !recordingId) return;
    
    setIsGenerating(true);
    try {
      await onGenerateManual?.(selectedRole, selectedFormat);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    const roleData = roles.find(r => r.value === role);
    if (!roleData) return Users;
    return roleData.icon;
  };

  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-sm shadow-glass">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Generate Manual</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create intelligent documentation from your recorded session
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Your Role</label>
          <div className="grid gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              
              return (
                <div
                  key={role.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background/50 hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${role.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.label}</span>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">Selected</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Export Format</label>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex items-center gap-2">
                    <span>{format.icon}</span>
                    <span>{format.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!selectedRole || !recordingId || isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Generating Manual...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Manual
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center p-4 bg-accent rounded-lg">
          <p className="text-xs text-accent-foreground">
            🚀 Generation typically takes 30-60 seconds depending on session length
          </p>
        </div>
      </div>
    </Card>
  );
};