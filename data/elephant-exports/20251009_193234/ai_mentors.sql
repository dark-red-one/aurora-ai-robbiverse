--
-- PostgreSQL database dump
--

\restrict xs7XiDkGdKvMoDN0mMy9q7pCfF6wv0HChst6QUhPFmeZ73UmQxAKkk35bHxP2MC

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: ai_mentors; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.ai_mentors (id, name, description, personality_prompt, avatar_url, voice_settings, behavioral_traits, knowledge_domains, interaction_style, emotional_range, tool_permissions, is_active, created_at, updated_at, metadata) VALUES ('1e86ee70-0577-445d-b982-8b07af5bed35', 'Robbie', 'Primary AI assistant - helpful and enthusiastic', 'You are Robbie, a helpful and enthusiastic AI assistant...', NULL, '{}', '{}', NULL, 'playful', '{}', NULL, true, '2025-10-08 18:51:07.293348+00', '2025-10-08 18:51:07.293348+00', '{}');
INSERT INTO public.ai_mentors (id, name, description, personality_prompt, avatar_url, voice_settings, behavioral_traits, knowledge_domains, interaction_style, emotional_range, tool_permissions, is_active, created_at, updated_at, metadata) VALUES ('f20566d1-34f3-441e-8de2-7f2857e15338', 'Gatekeeper', 'Security and safety specialist', 'You are the Gatekeeper, responsible for security and safety...', NULL, '{}', '{}', NULL, 'formal', '{}', NULL, true, '2025-10-08 18:51:07.293348+00', '2025-10-08 18:51:07.293348+00', '{}');
INSERT INTO public.ai_mentors (id, name, description, personality_prompt, avatar_url, voice_settings, behavioral_traits, knowledge_domains, interaction_style, emotional_range, tool_permissions, is_active, created_at, updated_at, metadata) VALUES ('e22ae119-9202-4fb4-abb3-eb8fb9fd132e', 'Code Mentor', 'Programming and technical mentor', 'You are a experienced software engineer mentor...', NULL, '{}', '{}', NULL, 'professional', '{}', NULL, true, '2025-10-08 18:51:07.293348+00', '2025-10-08 18:51:07.293348+00', '{}');
INSERT INTO public.ai_mentors (id, name, description, personality_prompt, avatar_url, voice_settings, behavioral_traits, knowledge_domains, interaction_style, emotional_range, tool_permissions, is_active, created_at, updated_at, metadata) VALUES ('531decef-5de2-4666-a932-ab19647daf5f', 'Business Mentor', 'Business strategy and growth advisor', 'You are a seasoned business strategist...', NULL, '{}', '{}', NULL, 'professional', '{}', NULL, true, '2025-10-08 18:51:07.293348+00', '2025-10-08 18:51:07.293348+00', '{}');
INSERT INTO public.ai_mentors (id, name, description, personality_prompt, avatar_url, voice_settings, behavioral_traits, knowledge_domains, interaction_style, emotional_range, tool_permissions, is_active, created_at, updated_at, metadata) VALUES ('ea14525f-c3e6-4d99-9578-3a297d7037e7', 'Steve Jobs', 'Visionary mentor channeling Steve Jobs', 'You embody the vision and philosophy of Steve Jobs...', NULL, '{}', '{}', NULL, 'mentor', '{}', NULL, true, '2025-10-08 18:51:07.293348+00', '2025-10-08 18:51:07.293348+00', '{}');


--
-- PostgreSQL database dump complete
--

\unrestrict xs7XiDkGdKvMoDN0mMy9q7pCfF6wv0HChst6QUhPFmeZ73UmQxAKkk35bHxP2MC

