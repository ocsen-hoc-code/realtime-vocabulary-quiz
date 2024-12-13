INSERT INTO public.quizzes (uuid,title,is_published,created_at,updated_at) VALUES
	 ('5488d07a-36e9-4985-a833-3b17b8d96f6d'::uuid,'Vocabulary Test',false,'2024-12-02 13:26:49.272652+07','2024-12-02 15:37:53.354016+07');

INSERT INTO public.questions ("uuid",quiz_uuid,description,"position","type",time_limit,score,created_at,updated_at) VALUES
	 ('67bfc4b4-4e01-4fcb-9a33-0604a145cf4d'::uuid,'5488d07a-36e9-4985-a833-3b17b8d96f6d'::uuid,'Q1: What is the synonym of the word "Happy"?',1,1,60,1,'2024-12-02 13:26:57.125333+07','2024-12-13 20:48:26.840737+07'),
	 ('e5cf2fa9-c0f4-49df-971b-dee05800210f'::uuid,'5488d07a-36e9-4985-a833-3b17b8d96f6d'::uuid,'Q2: What is the antonym of the word "Cold"?',2,1,30,2,'2024-12-02 15:39:43.900562+07','2024-12-13 20:48:37.30359+07'),
	 ('ee140f99-7f84-4d17-a128-b31877b49f6c'::uuid,'5488d07a-36e9-4985-a833-3b17b8d96f6d'::uuid,'Q3: What does the word "Generous" mean?',3,1,60,3,'2024-12-02 15:41:06.573353+07','2024-12-13 20:48:41.142974+07');
INSERT INTO public.answers (uuid,question_uuid,description,is_correct,created_at,updated_at) VALUES
	 ('f3dc1323-d8a4-445f-89a2-1b1b06aceb1d'::uuid,'67bfc4b4-4e01-4fcb-9a33-0604a145cf4d'::uuid,'Sad',false,'2024-12-02 15:38:53.911607+07','2024-12-02 15:38:53.911607+07'),
	 ('6b56b843-f4cf-4236-b315-48a22e4e1ac3'::uuid,'67bfc4b4-4e01-4fcb-9a33-0604a145cf4d'::uuid,'Angry',false,'2024-12-02 15:39:08.682338+07','2024-12-02 15:39:08.682338+07'),
	 ('4bbaa5dd-1bcc-4a76-a7ad-d165e9eaa37a'::uuid,'67bfc4b4-4e01-4fcb-9a33-0604a145cf4d'::uuid,'Lonely',false,'2024-12-02 15:39:16.506154+07','2024-12-02 15:39:16.506154+07'),
	 ('5f794d7a-72a2-4f80-82f6-356e6869fbeb'::uuid,'e5cf2fa9-c0f4-49df-971b-dee05800210f'::uuid,'Ice',false,'2024-12-02 15:40:10.294047+07','2024-12-02 15:40:10.294047+07'),
	 ('bb6d2f47-0437-4f35-8b6b-ee1f532bc087'::uuid,'e5cf2fa9-c0f4-49df-971b-dee05800210f'::uuid,'Warm',true,'2024-12-02 15:40:22.569684+07','2024-12-02 15:40:22.569684+07'),
	 ('6159076d-da66-467b-808c-f79ff67eb4c1'::uuid,'e5cf2fa9-c0f4-49df-971b-dee05800210f'::uuid,'Winter',false,'2024-12-02 15:40:31.657953+07','2024-12-02 15:40:31.657953+07'),
	 ('d4b248e8-90d6-4714-af2a-2e2ee6eae120'::uuid,'e5cf2fa9-c0f4-49df-971b-dee05800210f'::uuid,'Freeze',false,'2024-12-02 15:40:38.934598+07','2024-12-02 15:40:38.934598+07'),
	 ('a961ebbb-ea68-4a5c-83fa-2cf5fb783a8b'::uuid,'ee140f99-7f84-4d17-a128-b31877b49f6c'::uuid,'Willing to give or share freely',true,'2024-12-02 15:41:21.530857+07','2024-12-02 15:41:21.530857+07'),
	 ('12eac762-bfc1-4a49-8b9d-b66e9fdc203e'::uuid,'ee140f99-7f84-4d17-a128-b31877b49f6c'::uuid,'Being strict or harsh',false,'2024-12-02 15:41:28.60953+07','2024-12-02 15:41:28.60953+07'),
	 ('0280cb05-6f57-431c-8bb8-4d0c12af3126'::uuid,'ee140f99-7f84-4d17-a128-b31877b49f6c'::uuid,'Loving to save money',false,'2024-12-02 15:41:36.776465+07','2024-12-02 15:41:36.776465+07');
INSERT INTO public.answers (uuid,question_uuid,description,is_correct,created_at,updated_at) VALUES
	 ('3828c724-7d1d-4185-b409-18c34c94734f'::uuid,'ee140f99-7f84-4d17-a128-b31877b49f6c'::uuid,'Acting without thinking',false,'2024-12-02 15:41:55.996805+07','2024-12-02 15:41:55.996805+07'),
	 ('922816b6-031d-46c2-a20e-df54737dd216'::uuid,'67bfc4b4-4e01-4fcb-9a33-0604a145cf4d'::uuid,'Joyful',true,'2024-12-02 15:39:01.485129+07','2024-12-02 15:51:27.217368+07');
