--
-- PostgreSQL database dump
--

\restrict RuN9Zk7Maxcs765rnGyssvoANeLMnz3Z2c4Ptt4QYzkmx6JJAX6rNYbeUgH33Pb

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
-- Data for Name: ai_personality_state; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.ai_personality_state (personality_id, current_mood, current_mode, energy_level, focus_state, last_state_change, state_metadata, updated_at) VALUES ('robbie', 4, 'professional', 'normal', 'available', '2025-10-05 13:52:11.996448', NULL, '2025-10-05 13:52:11.996448');
INSERT INTO public.ai_personality_state (personality_id, current_mood, current_mode, energy_level, focus_state, last_state_change, state_metadata, updated_at) VALUES ('steve-jobs', 5, 'mentoring', 'normal', 'available', '2025-10-05 13:52:11.996448', NULL, '2025-10-05 13:52:11.996448');
INSERT INTO public.ai_personality_state (personality_id, current_mood, current_mode, energy_level, focus_state, last_state_change, state_metadata, updated_at) VALUES ('bookkeeper', 4, 'analytical', 'normal', 'available', '2025-10-05 13:52:11.996448', NULL, '2025-10-05 13:52:11.996448');
INSERT INTO public.ai_personality_state (personality_id, current_mood, current_mode, energy_level, focus_state, last_state_change, state_metadata, updated_at) VALUES ('gatekeeper', 4, 'vigilant', 'normal', 'available', '2025-10-05 13:52:11.996448', NULL, '2025-10-05 13:52:11.996448');


--
-- PostgreSQL database dump complete
--

\unrestrict RuN9Zk7Maxcs765rnGyssvoANeLMnz3Z2c4Ptt4QYzkmx6JJAX6rNYbeUgH33Pb

