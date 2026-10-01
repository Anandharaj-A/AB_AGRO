import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedWork?: (data: {
    farmerName: string;
    village: string;
    crop: 'paddy' | 'ragi';
    quantity: number;
    rate: number;
    amountReceived: number;
  }) => void;
}

export const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedWork,
}) => {
  const { setCurrentScreen } = useHarvester();
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<'kannada' | 'tamil' | 'english'>('kannada');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<{
    farmerName: string;
    village: string;
    crop: 'paddy' | 'ragi';
    quantity: number;
    rate: number;
    amountReceived: number;
  } | null>(null);

  if (!isOpen) return null;

  const samples = {
    kannada: 'ಸುರೇಶ್ ಅವರಿಗೆ 5 ಎಕರೆ ಭತ್ತ ಕೊಯ್ಲು ಮಾಡಲಾಗಿದೆ, ದರ 2800',
    tamil: 'சுரேஷ் நிலத்தில் 5 ஏக்கர் நெல் அறுவடை முடிந்தது, விலை 2800',
    english: '5 acres Paddy harvested for Suresh at 2800 per acre, 10000 cash received',
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setParsedData(null);

    // Simulate realistic recognition or use Web Speech API if supported
    setTimeout(() => {
      const recognized = samples[language];
      setTranscript(recognized);
      setIsRecording(false);
      setParsedData({
        farmerName: 'Suresh Kumar',
        village: 'Koppa Farm',
        crop: 'paddy',
        quantity: 5.0,
        rate: 2800,
        amountReceived: 10000,
      });
    }, 1800);
  };

  const handleApply = () => {
    if (parsedData && onApplyParsedWork) {
      onApplyParsedWork(parsedData);
      onClose();
    } else {
      setCurrentScreen('add-work');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-3 sm:p-4">
      <div className="bg-surface-container-lowest rounded-2xl p-5 w-full max-w-md mx-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30 animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Voice Entry Assistant
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                ಕನ್ನಡ • தமிழ் • English Field Speech
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Language selector chips */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-full">
          <button
            type="button"
            onClick={() => setLanguage('kannada')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              language === 'kannada'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ಕನ್ನಡ (Kannada)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('tamil')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              language === 'tamil'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            தமிழ் (Tamil)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('english')}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
              language === 'english'
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            English
          </button>
        </div>

        {/* Central mic visualization */}
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              isRecording
                ? 'bg-tertiary text-on-tertiary animate-pulse scale-105'
                : 'bg-secondary text-on-secondary hover:bg-secondary/90 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[36px]">
              {isRecording ? 'graphic_eq' : 'mic'}
            </span>
          </button>

          <span className="font-label-md text-label-md font-bold text-on-surface">
            {isRecording
              ? 'Listening to operator voice...'
              : 'Tap to Speak Field Record'}
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
            Example: "{samples[language]}"
          </p>
        </div>

        {/* Transcript & Extracted Fields Preview */}
        {transcript && (
          <div className="bg-secondary-container/40 p-3.5 rounded-xl flex flex-col gap-2">
            <span className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
              Understood Speech:
            </span>
            <p className="font-body-md text-body-md text-on-surface font-medium italic">
              "{transcript}"
            </p>

            {parsedData && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-secondary/20">
                <div className="bg-surface-container-lowest p-2 rounded-lg text-xs">
                  <span className="text-outline block">Farmer Name</span>
                  <span className="font-bold text-on-surface">
                    {parsedData.farmerName}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-xs">
                  <span className="text-outline block">Harvest Acreage</span>
                  <span className="font-bold text-on-surface">
                    {parsedData.quantity} Acres @ ₹{parsedData.rate}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-full bg-surface-container font-label-md text-on-surface font-bold hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-12 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">
              check_circle
            </span>
            <span>Fill In Add Work</span>
          </button>
        </div>
      </div>
    </div>
  );
};
