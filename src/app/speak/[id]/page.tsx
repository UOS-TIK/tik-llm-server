'use client';
import { useToast, VStack, Heading, HStack, Button, Text } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useCallback } from 'react';

export default function SpeakPage() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [status, setStatus] = useState<'ready' | 'recording' | 'processing'>('ready');
  const [messages, setMessages] = useState<string[]>(['[안내] 지금부터 면접을 시작하겠습니다.']);
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

    const newMessages = [...messages, `지원자: ${sttRes.text}`];

    setMessages(newMessages);

    const llmRes: { reply: string; isFinished: boolean } = await fetch(
      'http://localhost:4000/speak',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: process.env.NEXT_PUBLIC_LLM_API_KEY || '',
        },
        body: JSON.stringify({
          interviewId: parseInt(params.get('id') || '10000'),
          message: sttRes.text,
        }),
      }
    ).then((data) => data.json());

    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: llmRes.reply,
      }),
    }).then((data) => data.blob());

    const audio = new Audio();
    audio.src = URL.createObjectURL(ttsRes);
    audio.play();

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    htmlAudioRef.current = audio;
    setMessages((prev) => [...prev, `면접관: ${llmRes.reply}`]);
    setStatus('ready');

    if (llmRes.isFinished) {
      toast({ title: '면접이 종료되었습니다.', status: 'success' });
      setTimeout(() => router.push(`/result/${params.get('id')}`), 1000);
    }
  }, [messages, params, toast, router]);

  const toggleAudioPlayPause = useCallback(() => {
    if (htmlAudioRef.current?.paused) {
      htmlAudioRef.current?.play();
    } else {
      htmlAudioRef.current?.pause();
    }
  }, []);

  return (
    <VStack my={8} spacing={4}>
      <VStack spacing={4}>
        <Heading size={'lg'}>Recorder</Heading>
        <HStack spacing={4}>
          <Button
            onClick={status === 'ready' ? startRecording : stopRecording}
            colorScheme={status === 'ready' ? 'facebook' : 'red'}
            isLoading={status === 'processing'}
          >
            {status.toUpperCase()}
          </Button>

          <Button onClick={toggleAudioPlayPause} colorScheme={'gray'}>
            PLAY / PAUSE
          </Button>
        </HStack>
      </VStack>

      <VStack spacing={4} width={'60%'}>
        <Heading size={'lg'}>Messages</Heading>
        <VStack overflow={'scroll'} alignItems={'flex-start'} height={'48lvh'}>
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
