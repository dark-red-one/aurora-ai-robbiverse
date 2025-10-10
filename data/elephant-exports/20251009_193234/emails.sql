--
-- PostgreSQL database dump
--

\restrict v52J8DTbzXztgiy5Sp8sh7cuHFalNRidGDBhRsDx531gvQrpDJUnnHt40ZSTXvH

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
-- Data for Name: emails; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.emails (id, gmail_id, subject, sender_email, sender_name, body, received_at, is_read, importance, category, deal_id) VALUES (1, 'mock_62772', 'Quick sync on TestPilot demo', 'sarah.johnson@wholefoods.com', 'Sarah Johnson', 'Hey Allan, loved the demo! Can we schedule a follow-up call?', '2025-09-28 12:48:19.436408+00', true, 8, 'deal', NULL);
INSERT INTO public.emails (id, gmail_id, subject, sender_email, sender_name, body, received_at, is_read, importance, category, deal_id) VALUES (2, 'mock_51802', 'Budget approval - Q1 pilot', 'mchen@traderjoes.com', 'Michael Chen', 'Great news! We got budget approved for the 10-store pilot program.', '2025-10-01 12:48:19.501713+00', false, 9, 'deal', NULL);
INSERT INTO public.emails (id, gmail_id, subject, sender_email, sender_name, body, received_at, is_read, importance, category, deal_id) VALUES (3, 'mock_24417', 'Meeting follow-up', 'jmartinez@kroger.com', 'Jennifer Martinez', 'Thanks for the insights. Our team wants to move forward with TestPilot.', '2025-10-01 12:48:19.544066+00', true, 7, 'deal', NULL);
INSERT INTO public.emails (id, gmail_id, subject, sender_email, sender_name, body, received_at, is_read, importance, category, deal_id) VALUES (4, 'mock_26993', 'Data request', 'david.kim@target.com', 'David Kim', 'Can you share the demographic breakdown from last quarter''s test?', '2025-10-03 12:48:19.582738+00', true, 6, 'deal', NULL);
INSERT INTO public.emails (id, gmail_id, subject, sender_email, sender_name, body, received_at, is_read, importance, category, deal_id) VALUES (5, 'mock_91613', 'Pricing discussion', 'landerson@walmart.com', 'Lisa Anderson', 'We need to discuss enterprise pricing for multi-banner access.', '2025-09-30 12:48:19.625788+00', true, 8, 'deal', NULL);


--
-- Name: emails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aurora_app
--

SELECT pg_catalog.setval('public.emails_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict v52J8DTbzXztgiy5Sp8sh7cuHFalNRidGDBhRsDx531gvQrpDJUnnHt40ZSTXvH

