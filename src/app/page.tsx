'use client';
import { Button, Heading, Text, VStack } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
// NEXT_PUBLIC_OPENAI_API_KEY=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
export default function Home() {
  const [status, setStatus] = useState<'ready' | 'recording' | 'processing'>('ready');
  const [messages, setMessages] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    setStatus('recording');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

    mediaRecorder.start(100);

    mediaRecorderRef.current = mediaRecorder;
  }, []);

  const stopRecording = useCallback(async () => {
    setStatus('processing');

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) {
      return null;
    }

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    const formData = new FormData();
    formData.append('file', new Blob(audioChunksRef.current, { type: 'audio/mp3' }));
    formData.append('model', 'whisper-1');

    const sttRes: { text: string } = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: formData,
    }).then((data) => data.json());

    const newMessages = [...messages, `user: ${sttRes.text}`];

    setMessages(newMessages);

    const llmRes: { text: string } = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. answer within 3 lines.',
          },
          ...newMessages.map((each) => {
            const role = each.startsWith('user: ') ? 'user' : 'assistant';
            const content = each.split(`${role}: `)[1];

            return { role, content };
          }),
        ],
      }),
    })
      .then((data) => data.json())
      .then((json) => ({ text: json.choices[0].message.content }));

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: llmRes.text,
      }),
    }).then((data) => data.blob());

    const audio = new Audio();
    audio.src = URL.createObjectURL(ttsRes);
    audio.play();

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    htmlAudioRef.current = audio;
    setMessages((prev) => [...prev, `assistant: ${llmRes.text}`]);
    setStatus('ready');
  }, [messages]);

  const toggleAudioPlayPause = useCallback(() => {
    if (htmlAudioRef.current?.paused) {
      htmlAudioRef.current?.play();
    } else {
      htmlAudioRef.current?.pause();
    }
  }, []);

  return (
    <VStack spacing={8} padding={8}>
      <VStack spacing={4}>
        <Heading>Recorder</Heading>
        <Button
          onClick={status === 'ready' ? startRecording : stopRecording}
          colorScheme={status === 'ready' ? 'facebook' : 'red'}
          isLoading={status === 'processing'}
        >
          {status.toUpperCase()}
        </Button>
      </VStack>

      <VStack spacing={4}>
        <Heading>Messages</Heading>
        <Button onClick={toggleAudioPlayPause} colorScheme={'gray'}>
          PLAY / PAUSE
        </Button>

        <VStack alignItems={'flex-start'} width={'80%'}>
          {messages.map((each, index) => (
            <Text key={index} fontSize={'xl'}>
              {each}
            </Text>
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
}
