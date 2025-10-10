--
-- PostgreSQL database dump
--

\restrict VJd3ooSrS01Km3gTu884qFfgWX5gyOPlZzaWVhOi1KgxGc6mLaeLAZzeHza2Ujm

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
-- Data for Name: inbox_categories; Type: TABLE DATA; Schema: public; Owner: aurora_app
--

INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (1, 'inbox', 'Main inbox messages', '#0075ca', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (2, 'important', 'High priority messages', '#d73a49', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (3, 'unread', 'Unread messages', '#28a745', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (4, 'sent', 'Sent messages', '#6c757d', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (5, 'drafts', 'Draft messages', '#ffc107', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (6, 'trash', 'Deleted messages', '#dc3545', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (7, 'allan-notes', 'Allan personal notes', '#6f42c1', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (8, 'robbie-notes', 'Robbie system notes', '#28a745', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (9, 'business', 'Business communications', '#0075ca', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (10, 'github', 'GitHub notifications', '#24292e', true, '2025-10-06 07:37:02.128689');
INSERT INTO public.inbox_categories (id, category_name, description, color_code, is_active, created_at) VALUES (11, 'amazon', 'Amazon orders', '#ff9900', true, '2025-10-06 07:37:02.128689');


--
-- Name: inbox_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: aurora_app
--

SELECT pg_catalog.setval('public.inbox_categories_id_seq', 11, true);


--
-- PostgreSQL database dump complete
--

\unrestrict VJd3ooSrS01Km3gTu884qFfgWX5gyOPlZzaWVhOi1KgxGc6mLaeLAZzeHza2Ujm

