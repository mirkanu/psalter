--
-- PostgreSQL database dump
--

\restrict TQBHCbIO12KkqwU7QZb66KlD2b1FyqbvxO5wymRJgw2Jgvvua4uIy6jqyjwNEy5

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

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
-- Data for Name: tunes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (41, 'recFdqPE9LjoD1bj0', 'Kingsfold', 'CM', 'X:1
T:Kingsfold
M:C
L:1/8
Q:1/4=76
K:G
d''2g''2d''2b2 | e''2d''2d''c''
% PHRASE_BREAK
b2 |
a2g6 | g2b2a2
% PHRASE_BREAK
g2 | f''2e''2d''2b6
', NULL, '{"doh":"G","time":"C","soprano":":s |d'' :s |m :l |s :s.f |m :r |d :—|— :d |m :r |d :t |l :s |m :— |—||","alto":":d |m :r |d :f |m :r |d :t_1 |d :— |— :s_1 |d :d |d :d |d :d |d :— |—||","tenor":":m |s :s |s :l |s :t |l :s |m :— |— :m |m :s |l :t_1 |l_1 :s_1 |m_1 :— |—||","bass":":d |d :t_1 |l_1 :f_1 |m_1 :r |d :— |— :d_1 |d_1 :d_1 |g_1 :— |— :— :||"}', 'X:1
T:Kingsfold
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d''2g''2d''2b2 | e''2d''2d''c''b2 | a2g6 | g2b2a2g2 | f''2e''2d''2b6
[V:2] g2b2a2g2 | c''2b2a2g2 | f2g6 | d2g2g2g2 | g2g2g2g6
[V:3] b2d''2d''2d''2 | e''2d''2f''2e''2 | d''2b6 | b2b2d''2e''2 | f2e2d2B6
[V:4] g2g2f2e2 | c2B2a2g6 | G2G2G2z8', NULL, NULL, NULL, 'https://youtu.be/B1tY90ODx0Q', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Kingsfold
M:C
L:1/8
Q:1/4=76
K:G
d''2g''2d''2b2 | e''2d''2d''c''
% PHRASE_BREAK
b2 |
a2g6 | g2b2a2
% PHRASE_BREAK
g2 | f''2e''2d''2b6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (53, 'recK01mMrrM5is708', 'Stuttgart', '87 87', 'X:1
T:Stuttgart
M:C
L:1/8
Q:1/4=76
K:G
d2d2g2g2 | a2a2b2g2 | d''2d''2e''2c''2 | a2d''2b4 | b2b2a2b2 | g2a2f2f2 | e2e2d2g2 | g2f2g4', NULL, '{"doh":"G","time":"C","soprano":"s_1 :s_1 |d :d | r :r |m :d | s :s |l :f | r :s |m :—|| m :m |r :m | d :r |t_1 :t_1 | l_1 :l_1 |s_1 :d | d :t_1 |d :—||","alto":"s_1 :s_1 |m_1 :s_1 | l_1 :s_1 |s_1 :s_1 | s_1 :d |d :d | d :t_1 |d :—|| s_1 :s_1 |s_1 :se_1 | l_1 :l_1 |l_1 :se_1 | l_1 :f_1 |f_1 :m_1 | l_1 :s_1 |s_1 :—||","tenor":"m :r |d :d | d :t_1 |d :m | r :m |f :l | s :s |s :—|| d :d |t_1 :t_1 | d :f |m :m | d :r |t_1 :d | r :r |m :—||","bass":"d :t_1 |l_1 :m_1 | f_1 :s_1 |d_1 :d | t_1 :d |f_1 :f_1 | s_1 :s_1 |d :—|| d_1 :m_1 |s_1 :m_1 | l_1 :r_1 |m_1 :m_1 | f_1 :r_1 |s_1 :l_1 | f_1 :s_1 |d_1 :—||"}', 'X:1
T:Stuttgart
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2d2g2g2 | a2a2b2g2 | d''2d''2e''2c''2 | a2d''2b4 | b2b2a2b2 | g2a2f2f2 | e2e2d2g2 | g2f2g4
[V:2] d2d2B2d2 | e2d2d2d2 | d2g2g2g2 | g2f2g4 | d2d2d2^d2 | e2e2e2^d2 | e2c2c2B2 | e2d2d4
[V:3] b2a2g2g2 | g2f2g2b2 | a2b2c''2e''2 | d''2d''2d''4 | g2g2f2f2 | g2c''2b2b2 | g2a2f2g2 | a2a2b4
[V:4] g2f2e2B2 | c2d2G2g2 | f2g2c2c2 | d2d2g4 | G2B2d2B2 | e2A2B2B2 | c2A2d2e2 | c2d2G4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Stuttgart
M:C
L:1/8
Q:1/4=76
K:G
d2d2g2g2 | a2a2b2g2 | d''2d''2e''2c''2 | a2d''2b4 | b2b2a2b2 | g2a2f2f2 | e2e2d2g2 | g2f2g4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (4, 'rec0pVr2v77mjBdBf', 'use aots for this psalm', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (8, 'rec2ZNgyri6E5pO7w', 'Rutherford', '76 76 D', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.brethrenarchive.org/hymnology/recordings/hymn-tunes/rutherford/', NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (22, 'rec6fa2NNKNTo4cf6', 'Hawarden', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (27, 'rec7yXSZY6pzeVgXv', 'Penitence', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (31, 'rec9ePrmpBttTJj0E', 'St. Columba', '87 87', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://youtu.be/Sds1oHhFFSo?si=wDYRgN_z___OxaCA', NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (40, 'recFNXatIsrUp33TU', 'Brian''s mystery tune ("Ballymena")', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (43, 'recGK6Ar2Qenl8sdh', 'Lafayette', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Missing, also from youtube', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (48, 'recIvlnOdAm5Dbdyn', 'Going Home (?)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Missing, also from youtube', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (50, 'recJH0n6u7xVdt4OV', 'Ebenezer', '87 87', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (59, 'recM9xYCNnoMZi6Nn', 'Maitland', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (60, 'recMdQ6wDxGvHQhnN', 'Elrig', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (87, 'recWE93Rh5mHs0Oqp', 'I Need Thee', '66 66', 'X:1
T:I Need Thee
M:C
L:1/8
Q:1/4=76
K:Ab
A2e3eee | e4e2ee | ee3e2a4 | c2c3Adc | c2B2B2B3 | AcBB2A2A2 | A3BAFE2 | A2B2c3A | BBA4', NULL, '{"doh":"Ab","time":"C","soprano":":d |s :-.s :s.s |s :- :s |s.s :s.s :- :s |d'' :- || :m |m :-.d :f.m |m :r :r |r :-.d :m.r |r :d || :d |d :-.r :d.l_1 |s_1 :d :r |m :-.d :r.r |d :- ||","alto":":t_1 |d :-.d :d.d |d :- :d |d.d :d.d :- :d |d :- || :d |d :-.s_1 :d.d |d :t_1 :t_1 |s_1 :-.s_1 :s_1.s_1 |s_1 :- || :s_1 |l_1 :-.l_1 :l_1.f_1 |m_1 :s_1 :l_1 |s_1 :-.m_1 :f_1.f_1 |m_1 :- ||","tenor":":s |s :-.l :s.s |s :- :s |s.s :s.s :- :s |m :- || :s |s :-.m :l.s |s :- :s |f :-.m :s.f |f :m || :d |d :-.d :d.d |d :- :d |d :-.d :t_1.t_1 |d :- ||","bass":":s_1 |d :-.t_1 :d.l_1 |d :- :m |s_1.I :r.s_1 :- :r |d :- || :d |d :-.d :d.d |s_1 :- :s_1 |s_1 :-.s_1 :s_1.s_1 |d_1 :- || :m_1 |f_1 :-.f_1 :f_1.f_1 |d_1 :m_1 :f_1 |s_1 :-.s_1 :s_1.s_1 |d_1 :- ||"}', 'X:1
T:I Need Thee
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] A2e3eee | e4e2ee | ee3e2a4 | c2c3Adc | c2B2B2B3 | AcBB2A2A2 | A3BAFE2 | A2B2c3A | BBA4
[V:2] G2A3AAA | A4A2AA | AA3A2A4 | A2A3EAA | A2G2G2E3 | EEEE4E2 | F3FFDC2 | E2F2E3C | DDC4
[V:3] e2e3fee | e4e2ee | ee3e2c4 | e2e3cfe | e4e2d3 | cedd2c2A2 | A3AAAA4 | A2A3AGG | A4
[V:4] E2A3GAF | A4c2Ez | BE3B2A4 | A2A3AAA | E4E2E3 | EEEA,4C2 | D3DDDA,2 | C2D2E3E | EEA,4', NULL, NULL, NULL, 'https://www.hymnal.net/en/hymn/h/371', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:I Need Thee
M:C
L:1/8
Q:1/4=76
K:Ab
A2e3eee | e4e2ee | ee3e2a4 | c2c3Adc | c2B2B2B3 | AcBB2A2A2 | A3BAFE2 | A2B2c3A | BBA4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (69, 'recQzcs0cND1dibxb', 'Abbeyville', 'CM', 'X:1
T:Abbeyville
M:C
L:1/8
Q:1/4=76
K:C
g2c''3cde | fga2 b2 c''2
w: O Lord, how are _ my _ foes in- creas''d?
% PHRASE_BREAK
| c''2b2a2g2 ^f2 g6
w: a- gainst me ma- ny rise.
% PHRASE_BREAK
|
g2g2efg2 | c''2 e''2 c''2 g2
w: ma- ny say _ of my soul, For him
% PHRASE_BREAK
| g2a3aa2 | a2a2c''2b2 | a2g4g4 | g6
w: in God no suc- cour lies. in God no suc- cour lies.', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :-.d |r.m:f.s |l :t |d'':d'' |t :l |s :fe |s :- |- :s |s:m.f|s :d'' |m'':d'' |s :s |l :-.l |l :l |l :d'' |t :l |s :- |s :- |s :- |-||","alto":":s |d'' :-.d |r.m:f.s |l :t |d'':s |s :r |r :r |r :- |- :r |m:d.r|m :m |s :m |m :m |f :-.f |f :f |f :l |s :f |m :- |r :f |m :- |-||","tenor":":s |d'' :-.d |r.m:f.s |l :t |d'':m'' |r'':d'' |t :l |t :- |- :t |d'':s |s :s |d'':d'' |d'':d'' |d'' :-.d''|d'':d'' |d'' :- |- :d'' |d'' :-.d''|t :r'' |d'' :- |-||","bass":":s |d'' :-.d |r.m:f.s |l :t |d'':d |r :r |r :r |s :- |- :s_1 |d :d |d :d |d :d |d :d |f :-.f |f :f |f :- |- :f |s :-.s |s_1:s_1 |d :- |-||"}', 'X:1
T:Abbeyville
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''3cde | fga2b2c''2 | c''2b2a2g2 | ^f2g6 | g2g2efg2 | c''2e''2c''2g2 | g2a3aa2 | a2a2c''2b2 | a2g4g4 | g6
[V:2] g2c''3cde | fga2b2c''2 | g2g2d2d2 | d2d6 | d2e2cde2 | e2g2e2e2 | e2f3ff2 | f2f2a2g2 | f2e4d2 | f2e6
[V:3] g2c''3cde | fga2b2c''2 | e''2d''2c''2b2 | a2b6 | b2c''2g2g2 | g2c''2c''2c''2 | c''2c''3c''c''2 | c''2c''6 | c''2c''3c''b2 | d''2c''6
[V:4] g2c''3cde | fga2b2c''2 | c2d2d2d2 | d2g6 | G2c2c2c2 | c2c2c2c2 | c2f3ff2 | f2f6 | f2g3gG2 | G2c6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=SUJYost2Yiw&ab_channel=WestminsterCovenanter', NULL, 'Last line repeated', false, false, NULL, NULL, NULL, false, 'X:1
T:Abbeyville
M:C
L:1/8
Q:1/4=76
K:C
g2c''3cde | fga2
% PHRASE_BREAK
b2c''2 | c''2b2a2g2
% PHRASE_BREAK
 | ^f2g6 |
g2g2efg2 | c''2
% PHRASE_BREAK
e''2c''2g2 | g2a3aa2 | a2a2c''2b2 | a2g4g4 | g6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (96, 'recYwxNIdtzmIOQrR', 'Farrant', 'CM', 'X:1
T:Farrant
M:C
L:1/8
Q:1/4=76
K:G
g2g3ab2 | a2g2c''2a2
% PHRASE_BREAK
 |
a2b^c''d''2d''2 | ^c''2
% PHRASE_BREAK
d''6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":d |d :-.r |m :r |d :f |r :r |m.fe:s |s :fe |s :—|—||d |d||","alto":":s_1 |l_1 :-.t_1 |d :t_1 |l_1 :d |t_1 :t_1 |d :t_1.d |r :d |t_1 :—|—||l_1 |s_1||","tenor":":m |m :-.s |s :s |m :l |s :s |s :s |l :l |s :—|—||f |m||","bass":":d |l_1 :-.s_1 |d :s_1 |l_1 :f_1 |s_1 :s_1 |d :m |r :r |s_1 :—|—||f_1 |d_1||"}', 'X:1
T:Farrant
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2g3ab2 | a2g2c''2a2 | a2b^c''d''2d''2 | ^c''2d''6 | g2g2
[V:2] d2e3fg2 | f2e2g2f2 | f2g2fga2 | g2f6 | e2d2
[V:3] b2b3d''d''2 | d''2b2e''2d''2 | d''2d''2d''2e''2 | e''2d''6 | c''2b2
[V:4] g2e3dg2 | d2e2c2d2 | d2g2b2a2 | a2d6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/6zyYIWU-Vkw?si=aseByyag7UEmioM0', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Farrant
M:C
L:1/8
Q:1/4=76
K:G
g2g3ab2 | a2g2c''2a2
% PHRASE_BREAK
 |
a2b^c''d''2d''2 | ^c''2
% PHRASE_BREAK
d''6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (75, 'recSyguBtp6ZHP4eH', 'St. Botolph', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://youtu.be/U4C23h-t1bE?si=k4Qpu6eltgU_22Rw', NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (80, 'recUX6Kb1crFKiLVF', 'Holly', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Missing, also from youtube', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (81, 'recUnFgVqi0QlERGQ', 'Gabe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Missing, also from youtube', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (98, 'recaMEKUq3s3xlgCi', 'Bingham', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (106, 'reccPO1tOL9P5oelW', 'Alexander (written by Brian Crossett!)', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (114, 'receXPUjmt12lyEHZ', 'Israel', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://photos.app.goo.gl/7X7qE7CKnvXDt1EL6', 'need to upload', NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (115, 'receXxjCLSc00VSwE', 'do NOT use aots for this psalm', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (131, 'reclO0nF1wlo3Gdow', 'Thanksgiving', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://youtu.be/LB2efUp33B0', NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (134, 'recmhObnWs39QxxDX', 'Diademata', 'SM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.youtube.com/watch?v=NKWJenYWKmM&ab_channel=WestminsterCovenanter', NULL, '"Crown him with many crowns"', false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (135, 'recmkpwYlQp9KQ6UK', 'St Louis (Redner)', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (13, 'rec59eSdeZKUUaUlv', 'Contemplation', 'CM', 'X:1
T:Contemplation
M:C
L:1/8
Q:1/4=76
K:Eb
e2_g4_d2 | e4_g2=e2 | e2_d2 =B4
w: I mer- cy will and jud- _ gment sing,
% PHRASE_BREAK
| e2a4_g2 |
e4=e2 _d10
w: Lord, I will sing to thee.
% PHRASE_BREAK
| e2=e2a2_g2 | e4=e2_g2 a2 =a2 _a4
w: With wis- _ dom in a per- _ fect way
% PHRASE_BREAK
| b2=b2_g2=e2 | e3=e_d2=B10
w: shall my _ be- ha- _ viour be.', NULL, '{"doh":"Eb","time":"C","soprano":":m | s:-:r | m:-:s | f:m:r | d:-:m | l:-:s | m:-:f | r:-:- | -:-|| :m | f:l:s | m:-:f | s:l:ta | l:-:t | d'':s:f | m:-.f:r | d:-:- | -:-||","alto":":m | r:-:t_1 | d:-:d | d:-:t_1 | d:-:d | d:-:d | d:-:d | d.t_1:l_1 | t_1:-|| :t_1 | d:-:r | d:-:t_1 | d:-:m | f:-:r | d:-:d | d:- :t_1 | d:l_1:f_1 | s_1:-||","tenor":":s | s:-:s | s:-:s | l:s:f | m:-:l | l:-:d'' | s:-:l | r:-:- | s:-|| :s | f:-:r | s:-:s | s:-:s | l:-:s | s:m:f | s:- :f | m:f:r | m:-||","bass":":d | t_1:-:s_1 | d:-:m_1 | f_1:s_1:se_1 | l_1:-:l | f:-:m | d:-:f_1 | s_1:-:- | -:-|| :s_1 | l_1:-:t_1 | d:-:r | m:-:d | f:-:f | m:d:l_1 | s_1:- :s_1 | d:-:- | -:-||"}', 'X:1
T:Contemplation
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e2_g4_d2 | e4_g2=e2 | e2_d2=B4 | e2a4_g2 | e4=e2_d10 | e2=e2a2_g2 | e4=e2_g2 | a2=a2_a4 | b2=b2_g2=e2 | e3=e_d2=B10
[V:2] e2_d4B2 | =B4=B2=B4 | B2=B4=B2 | =B4=B2=B4 | =B2=B_BA2=B4 | B2=B4_d2 | =B4_B2=B4 | e2=e4_d2 | =B4=B2=B4 | B2=B2A2=E2 | _G4
[V:3] _g2_g4_g2 | _g4_g2a2 | _g2=e2_e4 | a2a4=b2 | _g4a2_d6 | _g4_g2=e4 | _d2_g4_g2 | _g4_g2a4 | _g2_g2e2=e2 | _g4=e2_e2 | =e2_d2_e4
[V:4] =B2_B4_G2 | =B4E2=E2 | _G2=G2A4 | a2=e4_e2 | =B4=E2_G10 | _G2A4B2 | =B4_d2e4 | =B2=e4=e2 | e2=B2A2_G4 | _G2=B10', NULL, NULL, NULL, 'https://youtu.be/gktWsljnyt8?si=LDy-aq3GFRGoNHD4', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Contemplation
M:C
L:1/8
Q:1/4=76
K:Eb
e2_g4_d2 | e4_g2=e2 | e2_d2
% PHRASE_BREAK
=B4 | e2a4_g2 |
e4=e2
% PHRASE_BREAK
_d10 | e2=e2a2_g2 | e4=e2_g2
% PHRASE_BREAK
 | a2=a2_a4 | b2=b2_g2=e2 | e3=e_d2=B10
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (151, 'recsw0BFNmb11sUsq', 'Agawam', 'CM', 'X:1
T:Agawam
M:C
L:1/8
Q:1/4=76
K:C
e4e2e2 | e2e2g2g2 | g4
% PHRASE_BREAK
g4 | a2a2g2g2 |
g4
% PHRASE_BREAK
g4 | c''2c''2c''2c''2 | d''2d''2e''4
% PHRASE_BREAK
 | d''4c''2g2 | a2g2g4
', NULL, '{"doh":"C","time":"C","soprano":"m:- | m:m | m:m | s:s | s:- | s:- | l:l | s:s | s:- || s:- | d'':d'' | d'':d'' | r'':r'' | m'':- | r'':- | d'':s | l:s | s:- ||","alto":"d:- | d:d | d:d | r:r | m:- | m:- | f:f | m:r | m:- || m:- | m:m | m:m | s:s | s:- | f:- | m:s | f:r | m:- ||","tenor":"s:- | s:s | l:l | t:t | d'':- | d'':- | d'':d'' | d'':t | d'':- || d'':- | s:s | l:l | t:t | d'':- | t:- | d'':d'' | d'':t | d'':- ||","bass":"d:- | d:d | l_1:l_1 | s_1:s_1 | d:- | d:- | f:f | s:s_1 | d:- || d:- | d:d | l:l | s:s | d'':- | s:- | l:m | f:s | d:- ||"}', 'X:1
T:Agawam
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] e4e2e2 | e2e2g2g2 | g4g4 | a2a2g2g2 | g4g4 | c''2c''2c''2c''2 | d''2d''2e''4 | d''4c''2g2 | a2g2g4
[V:2] c4c2c2 | c2c2d2d2 | e4e4 | f2f2e2d2 | e4e4 | e2e2e2e2 | g2g2g4 | f4e2g2 | f2d2e4
[V:3] g4g2g2 | a2a2b2b2 | c''4c''4 | c''2c''2c''2b2 | c''4c''4 | g2g2a2a2 | b2b2c''4 | b4c''2c''2 | c''2b2c''4
[V:4] c4c2c2 | A2A2G2G2 | c4c4 | f2f2g2G2 | c4c4 | c2c2a2a2 | g2g2c''4 | g4a2e2 | f2g2c4', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Agawam
M:C
L:1/8
Q:1/4=76
K:C
e4e2e2 | e2e2g2g2 | g4
% PHRASE_BREAK
g4 | a2a2g2g2 |
g4
% PHRASE_BREAK
g4 | c''2c''2c''2c''2 | d''2d''2e''4
% PHRASE_BREAK
 | d''4c''2g2 | a2g2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (2, 'rec0KbZwOhOfJfPw2', 'St. Anne', 'CM', 'X:1
T:St. Anne
M:C
L:1/8
Q:1/4=76
K:D
a2f2b2a2 | d''2d''2c''2d''2
% PHRASE_BREAK
 | a2d''2a2b2 |
^g2a6
% PHRASE_BREAK
 | c''2d''2b2e''2 | c''2d''2b2c''2
% PHRASE_BREAK
 | a2b2d''2e''2 | c''2d''6
', NULL, '{"doh":"D","time":"C","soprano":":s |m :l |s :d'' |d'' :t |d'' :s |d'' :s |l :fe |s :— |—|| :t |d'' :l |r'' :t |d'' :l |t :s |l :d'' |r'' :t |d'' :— |—|| d'' d''","alto":":d |d :d.r |m :m |r :r |m :m |m :m |m :r |r :— |—|| :r |m :d |f :r |m :r |t_1 :d |d :s |f :r |m :— |—|| f m","tenor":":m |s :l.t |d'' :d'' |l :s |s :d'' |d'' :t |l :l |t :— |—|| :s |s :l |l :s |s :l |se :s |f :s |l :s |s :— |—|| l s","bass":":d |d :f |m :l |f :s |d :d |l_1 :m |d :r |s_1 :— |—|| :s |d :f |r :s |d :f |m :m |f :m |r :s |d :— |—|| f d"}', 'X:1
T:St. Anne
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2f2b2a2 | d''2d''2c''2d''2 | a2d''2a2b2 | ^g2a6 | c''2d''2b2e''2 | c''2d''2b2c''2 | a2b2d''2e''2 | c''2d''6
[V:2] d2d2def2 | f2e2e2f2 | f2f2f2f2 | e2e6 | e2f2d2g2 | e2f2e2c2 | d2d2a2g2 | e2f6
[V:3] f2a2bc''d''2 | d''2b2a2a2 | d''2d''2c''2b2 | b2c''6 | a2a2b2b2 | a2a2b2^a2 | a2g2a2b2 | a2a6
[V:4] d2d2g2f2 | b2g2a2d2 | d2B2f2d2 | e2A6 | a2d2g2e2 | a2d2g2f2 | f2g2f2e2 | a2d6', NULL, NULL, NULL, 'https://youtu.be/fmXaWxrcdaQ?si=Kax5qFABpYwMfAPy', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Anne
M:C
L:1/8
Q:1/4=76
K:D
a2f2b2a2 | d''2d''2c''2d''2
% PHRASE_BREAK
 | a2d''2a2b2 |
^g2a6
% PHRASE_BREAK
 | c''2d''2b2e''2 | c''2d''2b2c''2
% PHRASE_BREAK
 | a2b2d''2e''2 | c''2d''6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (122, 'rechBO49QnRD5bbEW', 'New 136th', 'CM', 'X:1
T:New 136th
M:C
L:1/8
Q:1/4=76
K:D
dfa2a2a2 | fga2
% PHRASE_BREAK
a2a2 | a2b2a2b
% PHRASE_BREAK
c'' |
d''2d''2c''4 | c''2d''2b2a2
% PHRASE_BREAK
 | g2f3ga2 | bbg2e2f2 | g2e4d2
', NULL, '{"doh":"D","time":"C","soprano":":d.m |s :s |s :m.f |s :s |s :s |l :s |l.t:d'' |d'' :t |— || :t |d'' :l |s :f |m :-.f |s :l.l |f :r |m :f |r :— |d ||","alto":":d.m |s :s |s :m.f |s :s |s :m |f :d |f :m |m :r |— || :r |d :f |r :r |d :-.t_1 |d :d.d |l_1 :t_1 |d :d |d :t_1 |d ||","tenor":":d.m |s :s |s :m.f |s :s |s :d'' |d'' :s |f :s |s :s |— || :s |s :d'' |d'' :t |d'' :t.l |s :m.m |f :s |s :l |s :-.f |m ||","bass":":d.m |s :s |s :m.f |s :s |s :d |f :m |r :d |s_1 :s_1 |— || :s.f |m :f |s :s_1 |d :-.r |m :l_1.l_1 |r :s_1 |d :f_1 |s_1 :— |d ||"}', 'X:1
T:New 136th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] dfa2a2a2 | fga2a2a2 | a2b2a2bc'' | d''2d''2c''4 | c''2d''2b2a2 | g2f3ga2 | bbg2e2f2 | g2e4d2
[V:2] dfa2a2a2 | fga2a2a2 | f2g2d2g2 | f2f2e4 | e2d2g2e2 | e2d3cd2 | ddB2c2d2 | d2d2c2d2
[V:3] dfa2a2a2 | fga2a2a2 | d''2d''2a2g2 | a2a2a4 | a2a2d''2d''2 | c''2d''2c''ba2 | ffg2a2a2 | b2a3gf2
[V:4] dfa2a2a2 | fga2a2a2 | d2g2f2e2 | d2A2A4 | agf2g2a2 | A2d3ef2 | BBe2A2d2 | G2A4d2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:New 136th
M:C
L:1/8
Q:1/4=76
K:D
dfa2a2a2 | fga2
% PHRASE_BREAK
a2a2 | a2b2a2b
% PHRASE_BREAK
c'' |
d''2d''2c''4 | c''2d''2b2a2
% PHRASE_BREAK
 | g2f3ga2 | bbg2e2f2 | g2e4d2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (18, 'rec5m7SvlEkrGHwlM', 'Ellacomb', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.youtube.com/watch?v=jh9f0nyz5wE&ab_channel=AndrewRemillard', NULL, 'Hymn “Th’eternal Lord doth reign as king”', false, false, NULL, NULL, NULL, true, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (92, 'recXjtCdC7XcEDLWt', 'Cleansing Fountain', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.youtube.com/watch?v=z1WRt1Ag5gI&ab_channel=RodneyMusgrave', NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (142, 'recpN0NeJcP7yqbPI', 'Leominster', 'SM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.youtube.com/watch?v=FLQX-TNRjvg&ab_channel=BallymoneyReformedPresbyterianChurch', NULL, 'Solfege start: M m m m m f- f r r r f r- r m m f f s s s- d d m m r d- ', false, false, NULL, NULL, NULL, true, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (146, 'recr8HO2GDxyl2nk0', 'Eventide', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (147, 'recrNUvoRpSrR99e4', 'Rockingham', 'LM (long meter, 88 88)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (156, 'recuJVMYEWR7JT3mD', 'Traditional', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (160, 'recvOm385bXsEtIpT', 'Fountain', 'CM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, NULL, NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (5, 'rec10mjb26IYwrH7o', 'Lennox', '66 66 88', 'X:1
T:Lennox
M:C
L:1/8
Q:1/4=76
K:Bb
B2B2B2F2 | G2F6 | F2B2c2d2 | c2B6 | B2d2f2d2 | B2c6 | c2d2B2c2 | A2B6 | g2F2B2B2 | B2F2G2G2 | G2B2c2c2 | c2d2B2B2 | B2F2G2G2 | G2B2c6 | A2B6', NULL, '{"doh":"Bb","time":"C","soprano":":d |d :d |s_1 :l_1 |s_1 :- |- :s_1 |d :r |m :r |d :- |-||:d |m :s |m :d |r :- |- :r |m :d |r :t_1 |d :- |-||: |: |l :s_1 |d :d |d :s_1 |l_1 :l_1 |l_1 :d |r :r |r||:m |d :d |d :s_1 |l_1 :l_1 |l_1 :d |r :- |- :t_1 |d :- |-||","alto":":s_1 |s_1 :s_1 |s_1 :f_1 |r_1 :- |- :r_1 |s_1 :l_1 |s_1 :f_1 |m_1 :- |-||:m_1 |s_1 :s_1 |s_1 :fe_1 |s_1 :- |- :s_1 |s_1 :l_1 |l_1 :s_1 |s_1 :- |-||: |: |l :m_1 |m_1 :m_1 |m_1 :s_1 |f_1 :f_1 |f_1 :m_1 |s_1 :s_1 |s_1||:s_1 |s_1 :s_1 |s_1 :s_1 |f_1 :f_1 |f_1 :m_1 |l_1 :- |s_1 :- |s_1 :- |-||","tenor":":m |m :m |d :d |t_1 :- |- :t_1 |d :d |d :t_1 |d :- |-||:d |d :m |d :d |t_1 :- |- :t_1 |d :m |f :r |m :- |-||: |: |: |: |l :d |d :d |d :d |t_1 :t_1 |t_1||:d |m :- |- :m |d :- |- :d |f :- |- :r |m :- |-||","bass":":d_1 |d_1 :d_1 |m_1 :f_1 |s_1 :- |- :f_1 |m_1 :f_1 |s_1 :s_1 |d_1 :- |-||:d_1 |d_1 :d_1 |d :l_1 |s_1 :- |- :s_1 |d :l_1 |f_1 :s_1 |d_1 :- |-||:d_1 |s_1 :s_1 |s_1 :d |l_1 :l_1 |l_1 :m_1 |f_1 :f_1 |f_1 :l_1 |s_1 :s_1 |s_1||:d_1 |d_1 :- |- :d_1 |f_1 :- |- :l_1 |r_1 :- |s_1 :- |d_1 :- |-||"}', 'X:1
T:Lennox
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] B2B2B2F2 | G2F6 | F2B2c2d2 | c2B6 | B2d2f2d2 | B2c6 | c2d2B2c2 | A2B6 | g2F2B2B2 | B2F2G2G2 | G2B2c2c2 | c2d2B2B2 | B2F2G2G2 | G2B2c6 | A2B6
[V:2] F2F2F2F2 | E2C6 | C2F2G2F2 | E2D6 | D2F2F2F2 | =E2F6 | F2F2G2G2 | F2F6 | g2D2D2D2 | D2F2E2E2 | E2D2F2F2 | F2F2F2F2 | F2F2E2E2 | E2D2G4 | F4F6
[V:3] d2d2d2B2 | B2A6 | A2B2B2B2 | A2B6 | B2B2d2B2 | B2A6 | A2B2d2e2 | c2d6 | g2B2B2B2 | B2B2A2A2 | A2B2d6 | d2B6 | B2e6 | c2d6
[V:4] B,2B,2B,2D2 | E2F6 | E2D2E2F2 | F2B,6 | B,2B,2B,2B2 | G2F6 | F2B2G2E2 | F2B,6 | B,2F2F2F2 | B2G2G2G2 | D2E2E2E2 | G2F2F2F2 | B,2B,6 | B,2E6 | G2C4F4 | B,6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Lennox
M:C
L:1/8
Q:1/4=76
K:Bb
B2B2B2F2 | G2F6 | F2B2c2d2 | c2B6 | B2d2f2d2 | B2c6 | c2d2B2c2 | A2B6 | g2F2B2B2 | B2F2G2G2 | G2B2c2c2 | c2d2B2B2 | B2F2G2G2 | G2B2c6 | A2B6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (109, 'reccw64pFp0vZ4Kac', 'Webb', '76 76 D', 'X:1
T:Webb
M:C
L:1/8
Q:1/4=76
K:Bb
F2B3Bd2 | B2B4G2 | B2F2B2c2 | d2c6 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6 | F2c3cB2 | c2d4d2 | d2e2d2G2 | c2B4A2 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |d :—.d |m :d |d :— |l_1 :d |s_1 :d |r :m |r :— |— || :s_1 |d :—.d |m :d |d :— |l_1 :d |s_1 :d |m :r |d :— |— || :s_1 |r :—.r |d :r |m :— |m :m |f :m |l_1 :r |d :— |t_1 || :s_1 |d :—.d |m :d |d :— |l_1 :d |s_1 :d |m :r |d :— |— ||","alto":":s_1 |m_1 :—.m_1 |s_1 :s_1 |l_1 :— |f_1 :f_1 |s_1 :s_1 |s_1 :s_1 |s_1 :— |— || :s_1 |m_1 :—.m_1 |s_1 :s_1 |l_1 :— |f_1 :f_1 |s_1 :m_1 |s_1 :f_1 |m_1 :— |— || :s_1 |s_1 :—.s_1 |s_1 :s_1 |s_1 :— |s_1 :l_1 |l_1 :l_1 |l_1 :l_1 |s_1 :— |— || :s_1 |m_1 :—.m_1 |s_1 :s_1 |l_1 :— |f_1 :f_1 |s_1 :m_1 |s_1 :f_1 |m_1 :— |— ||","tenor":":s_1 |d :—.d |d :d |d :— |d :l_1 |d :d |t_1 :d |t_1 :— |— || :t_1 |d :—.d |d :d |d :— |d :l_1 |d :d |d :t_1 |d :— |— || :s_1 |t_1 :—.t_1 |l_1 :t_1 |d :— |d :de |r :de |r :f |m :— |r || :s_1 |s_1 :—.s_1 |d :d |d :— |d :l_1 |d :d |d :t_1 |d :— |— ||","bass":":s_1 |d_1 :—.d_1 |d_1 :m_1 |f_1 :— |f_1 :f_1 |m_1 :m_1 |r_1 :d_1 |s_1 :— |— || :s_1 |d_1 :—.d_1 |d_1 :m_1 |f_1 :— |f_1 :f_1 |m_1 :d_1 |s_1 :s_1 |d_1 :— |— || :s_1 |s_1 :—.s_1 |s_1 :s_1 |d :— |d :l_1 |r_1 :m_1 |f_1 :r_1 |s_1 :— |— || :s_1 |d_1 :—.d_1 |d_1 :m_1 |f_1 :— |f_1 :f_1 |m_1 :d_1 |s_1 :s_1 |d_1 :— |— ||"}', 'X:1
T:Webb
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2B3Bd2 | B2B4G2 | B2F2B2c2 | d2c6 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6 | F2c3cB2 | c2d4d2 | d2e2d2G2 | c2B4A2 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6
[V:2] F2D3DF2 | F2G4E2 | E2F2F2F2 | F2F6 | F2D3DF2 | F2G4E2 | E2F2D2F2 | E2D6 | F2F3FF2 | F2F4F2 | G2G2G2G2 | G2F6 | F2D3DF2 | F2G4E2 | E2F2D2F2 | E2D6
[V:3] F2B3BB2 | B2B4B2 | G2B2B2A2 | B2A6 | A2B3BB2 | B2B4B2 | G2B2B2B2 | A2B6 | F2A3AG2 | A2B4B2 | =B2c2=B2c2 | e2d4c2 | F2F3FB2 | B2B4B2 | G2B2B2B2 | A2B6
[V:4] F2B,3B,B,2 | D2E4E2 | E2D2D2C2 | B,2F6 | F2B,3B,B,2 | D2E4E2 | E2D2B,2F2 | F2B,6 | F2F3FF2 | F2B4B2 | G2C2D2E2 | C2F6 | F2B,3B,B,2 | D2E4E2 | E2D2B,2F2 | F2B,6', NULL, NULL, NULL, NULL, 'Missing, also from youtube', NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Webb
M:C
L:1/8
Q:1/4=76
K:Bb
F2B3Bd2 | B2B4G2 | B2F2B2c2 | d2c6 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6 | F2c3cB2 | c2d4d2 | d2e2d2G2 | c2B4A2 | F2B3Bd2 | B2B4G2 | B2F2B2d2 | c2B6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (66, 'recOkbqFunN69JdqU', 'Praetorius', 'CM', 'X:1
T:Praetorius
M:C
L:1/8
Q:1/4=76
K:G
g2d''2d''2e''2 | d''2d''3c''b2
% PHRASE_BREAK
 | g2a2b2c''2 | c''2b6
% PHRASE_BREAK
 |
b2b2d''2c''2 | a2b2g2f2
% PHRASE_BREAK
 | d2e2g2g2 | f2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":d |s :s |l :s |s :-.f |m :d |r :m |f :f |m :— |—|| :m |m :s |f :r |m :d |t_1 :s_1 |l_1 :d |d :t_1 |d :— |—|| d |d||","alto":":s_1 |s_1 :d |d :d |t_1 :-.t_1 |d :m_1 |s_1 :s_1 |l_1 :s_1 |s_1 :— |—|| :s_1 |d :s_1 |l_1 :s_1 |s_1 :fe_1 |s_1 :s_1 |f_1 :m_1 |s_1 :s_1 |s_1 :— |—|| l_1 |s_1||","tenor":":m |r :m |f :s |r :-.s |s :d |t_1 :d |d :t_1 |d :— |—|| :d |d :d |d :t_1 |d :d |r :d |d :d |r :r |m :— |—|| f |m||","bass":":d |t_1 :d |f_1 :m_1.f_1 |s_1 :-.s_1 |d :l_1 |s_1.f_1 :m_1 |r_1 :s_1 |d_1 :— |—|| :d |l_1 :m_1 |f_1 :s_1 |d :l_1 |s_1 :m_1 |f_1 :l_1 |s_1 :s_1 |d_1 :— |—|| f_1 |d_1||"}', 'X:1
T:Praetorius
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2d''2d''2e''2 | d''2d''3c''b2 | g2a2b2c''2 | c''2b6 | b2b2d''2c''2 | a2b2g2f2 | d2e2g2g2 | f2g6 | g2g2
[V:2] d2d2g2g2 | g2f3fg2 | B2d2d2e2 | d2d6 | d2g2d2e2 | d2d2^c2d2 | d2c2B2d2 | d2d6 | e2d2
[V:3] b2a2b2c''2 | d''2a3d''d''2 | g2f2g2g2 | f2g6 | g2g2g2g2 | f2g2g2a2 | g2g2g2a2 | a2b6 | c''2b2
[V:4] g2f2g2c2 | Bcd3dg2 | e2dcB2A2 | d2G6 | g2e2B2c2 | d2g2e2d2 | B2c2e2d2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/g-DkZS8K5WI?si=7_utQ1vxqUygptqa', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Praetorius
M:C
L:1/8
Q:1/4=76
K:G
g2d''2d''2e''2 | d''2d''3c''b2
% PHRASE_BREAK
 | g2a2b2c''2 | c''2b6
% PHRASE_BREAK
 |
b2b2d''2c''2 | a2b2g2f2
% PHRASE_BREAK
 | d2e2g2g2 | f2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (6, 'rec1sb8EWEmzQ1eVU', 'Scarborough', 'CM', 'X:1
T:Scarborough
M:C
L:1/8
Q:1/4=76
K:C
g2c''2c''2c''2 | d''2e''2d''c''
% PHRASE_BREAK
d''2 | g2a2gfe2
% PHRASE_BREAK
 |
d2c6 | c''d''e''2e''2e''2 | d''
% PHRASE_BREAK
c''d''2d''2d''2 | c''d''e''2f''2e''2 | d''2c''6
', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :d'' |d'' :r'' |m'' :r''.d'' |r'' :s |l :s.f |m :r |d :—|—|| :d''.r'' |m'' :m'' |m'' :r''.d'' |r'' :r'' |r'' :d''.r'' |m'' :f'' |m'' :r'' |d'' :—|—||","alto":":m |s :s |s :s |s :s.fe |s :s |f :d |d :t_1 |d :—|—|| :m.f |s :s |s :s.fe |s :s |s :s |s :l |s :f |m :—|—||","tenor":":d'' |m'' :m'' |d'' :t |d'' :r'' |t :d'' |d'' :d''.l |s :f |m :—|—|| :s |d'' :d'' |d'' :r''.l |t :t |t :d''.t |d'' :d'' |d'' :t |d'' :—|—||","bass":":d |d :d |m :s |d'' :t.l |s :m |f :m.f |s :s_1 |d :—|—|| :d |d'' :d'' |d'' :t.l |s :s |s :m.r |d :f |s :s_1 |d :—|—||"}', 'X:1
T:Scarborough
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''2c''2c''2 | d''2e''2d''c''d''2 | g2a2gfe2 | d2c6 | c''d''e''2e''2e''2 | d''c''d''2d''2d''2 | c''d''e''2f''2e''2 | d''2c''6
[V:2] e2g2g2g2 | g2g2g^fg2 | g2f2c2c2 | B2c6 | efg2g2g2 | g^fg2g2g2 | g2g2a2g2 | f2e6
[V:3] c''2e''2e''2c''2 | b2c''2d''2b2 | c''2c''2c''ag2 | f2e6 | g2c''2c''2c''2 | d''ab2b2b2 | c''bc''2c''2c''2 | b2c''6
[V:4] c2c2c2e2 | g2c''2bag2 | e2f2efg2 | G2c6 | c2c''2c''2c''2 | bag2g2g2 | edc2f2g2 | G2c6', NULL, NULL, NULL, NULL, NULL, 'Very difficult range! Start high!', false, false, NULL, NULL, NULL, false, 'X:1
T:Scarborough
M:C
L:1/8
Q:1/4=76
K:C
g2c''2c''2c''2 | d''2e''2d''c''
% PHRASE_BREAK
d''2 | g2a2gfe2
% PHRASE_BREAK
 |
d2c6 | c''d''e''2e''2e''2 | d''
% PHRASE_BREAK
c''d''2d''2d''2 | c''d''e''2f''2e''2 | d''2c''6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (3, 'rec0oFoZXSFegiNRK', 'Woodworth', 'LM (long meter, 88 88)', 'X:1
T:Woodworth
M:C
L:1/8
Q:1/4=76
K:Eb
=B_de4e2 | _g3=e_e2_d3
% PHRASE_BREAK
 | e=e2_e4_g2 | _g2_d2e2=e4
% PHRASE_BREAK
 | a2a4_g2 |
e4=B_de4 | e2
% PHRASE_BREAK
_g3=e_e2 | a4a2=b2 | z2a2_g4 | _g2_g3=e_e2 | _d6_g6 | e8
', NULL, '{"doh":"Eb","time":"C","soprano":":d.r|m:-:m|s:-.f:m|r:-.m:f|m:-:s|s:r:m|f:-:l|l:-:s|m:-||:d.r|m:-:m|s:-.f:m|l:-:l|d'':-t:l|s:-:s|s:-.f:m|r:-:-|s:-:-|m:-:-|:-||","alto":":d|d:-:d|m:-.r:d|t_1:-d:r|d:-:m|r:-:d|r:-:f|f:-:m|d:-||:d|d:-:d|m:-.r:d|f:-:f|f:-:f|m:-:m|m:-.r:d|t_1:-:-|t_1:-:-|d:-:-|:-||","tenor":":m.f|s:-:s|s:- :s|s:- :s|s:-:d''|t:-:s|s:-:t|d'':-:d''|s:-||:m.f|s:-:s|s:- :d''|d:-:d''|l:-.t:d''|d'':-:d''|s:- :s|s:-:-|s:-:-|s:-:-|:-||","bass":":d|d:-:d|d:- :d|s_1:- :s_1|d:-:d|s:-:s|s:-:s_1|d:-:d|d:-||:d|d:-:d|d:-.r:m|f:-:f|f:- :f|d:-:d|d:- :d|s:-:-|s_1:-:-|d:-:-|:-||"}', 'X:1
T:Woodworth
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B_de4e2 | _g3=e_e2_d3 | e=e2_e4_g2 | _g2_d2e2=e4 | a2a4_g2 | e4=B_de4 | e2_g3=e_e2 | a4a2=b2 | z2a2_g4 | _g2_g3=e_e2 | _d6_g6 | e8
[V:2] =B2=B4=B2 | e3_d=B2_B2 | z2_d2=B4 | e2_d4=B2 | _d4=e2=e4 | e2=B4=B2 | =B4=B2e3 | _d=B2=e4=e2 | =e4=e2_e4 | e2e3_d=B2 | B6B6 | =B8
[V:3] e=e_g4_g2 | _g4_g2_g4 | _g2_g4=b2 | b4_g2_g4 | b2=b4=b2 | _g4e=e_g4 | _g2_g4=b2 | =B4=b2a3 | b=b2=b4=b2 | _g4_g2_g6 | _g6_g8
[V:4] =B2=B4=B2 | =B4=B2_G4 | _G2=B4=B2 | _g4_g2_g4 | _G2=B4=B2 | =B4=B2=B4 | =B2=B3_de2 | =e4=e2=e4 | =e2=B4=B2 | =B4=B2_g6 | _G6=B8', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=9TyQffVSLso&ab_channel=ThePsalmsSung', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Woodworth
M:C
L:1/8
Q:1/4=76
K:Eb
=B_de4e2 | _g3=e_e2_d3
% PHRASE_BREAK
 | e=e2_e4_g2 | _g2_d2e2=e4
% PHRASE_BREAK
 | a2a4_g2 |
e4=B_de4 | e2
% PHRASE_BREAK
_g3=e_e2 | a4a2=b2 | z2a2_g4 | _g2_g3=e_e2 | _d6_g6 | e8
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (103, 'recbONdFvZcf9gMYf', 'Duke Street', 'LM (long meter, 88 88)', 'X:1
T:Duke Street
M:C
L:1/8
K:F
f2abc''2d''e'' | f''2e'' d'' c''4
w: O Lord, thou art my _ God and _ King;
% PHRASE_BREAK
| c''2c''c''d''2c''2 | b2 a2 g4
w: Thee will I mag- ni- fy and praise:
% PHRASE_BREAK
| a2agfac'' f'' d'' c'' b a g4
w: I will thee bless, _ and _ glad- _ ly _ sing
% PHRASE_BREAK
| c''2d''e''f''3b | a2g2f4
w: un- to thy ho- ly name al- ways.', NULL, '{"doh":"F","time":"C","soprano":"d :m.f|s :l.t|d'' :t.l|s :—|s :s.s|l :s|f :m|r :—||m :m.r|d.m:s.d''|l.s:f.m|r :—|s :l.t|d'' :-.f|m :r|d :—||d|d||","alto":"d :d.d|d :d.r|m :r.d|t_1 :—|d :d.d|d :d.s_1|l_1.t_1:d|t_1 :—||d :d.t_1|d :d|d :t_1.d|t_1:—|d :d.r|m.,r:d.d|d :t_1|d :—||l_1|s_1||","tenor":"m :s.s|s :f|s :s.fe|s :—|m :m.s|f :s|r :m.f|s :—||s :s.f|m.s:d''.s|l.m:f.s|s :—|s :f.f|m.,f:s.l|s :-.f|m :—||f|m||","bass":"d :d.r|m :f.r|d :r|s_1 :—|d :d.m|f :m|r :d|s_1 :—||d :d.s_1|d :m|f.m:r.d|s_1:—|m :f.r|d.,r:m.f|s :s_1|d :—||f_1|d||"}', 'X:1
T:Duke Street
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2abc''2d''e'' | f''2e''d''c''4 | c''2c''c''d''2c''2 | b2a2g4 | a2agfac''f'' | d''c''bag4 | c''2d''e''f''3b | a2g2f4 | f2f2
[V:2] f2fff2fg | a2gfe4 | f2fff2fc | def2e4 | f2fef2f2 | f2efe4 | f2fgagff | f2e2f4 | d2c2
[V:3] a2c''c''c''2b2 | c''2c''=bc''4 | a2ac''b2c''2 | g2abc''4 | c''2c''bac''f''c'' | d''abc''c''4 | c''2bbabc''d'' | c''3ba4 | b2a2
[V:4] f2fga2bg | f2g2c4 | f2fab2a2 | g2f2c4 | f2fcf2a2 | bagfc4 | a2bgfgab | c''2c2f4 | B2f2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=sRMEUFe056E&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Duke Street
M:C
L:1/8
Q:1/4=76
K:F
f2abc''2d''e'' | f''2e''
% PHRASE_BREAK
d''c''4 | c''2c''c''d''2c''2 | b2
% PHRASE_BREAK
a2g4 |
a2agfac''
% PHRASE_BREAK
f'' | d''c''bag4 | c''2d''e''f''3b | a2g2f4 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (24, 'rec6rdPrF9F6YlGOY', 'New Lydia', 'CM', 'X:1
T:New Lydia
M:C
L:1/8
Q:1/4=76
K:F
c''2c''2f''2a3 | ga2c''2f4
% PHRASE_BREAK
 | b2a2g8 | c''4d''c''
% PHRASE_BREAK
ba | g3ab2c''2 | a8 |
f''4
% PHRASE_BREAK
f''2f''2 | e''2d''2c''2b2 | a3gf2g2 | a2f''2e''2d''2 | c''2c''2f''2c''2 | c''2a2b2g2 | g2e2f8
', NULL, '{"doh":"F","time":"C","soprano":":s |s :d'' |m :-.r |m :s |d :— |f :m |r :— |—:— |s :— |l.s:f.m |r:-.m |f :s |m :— |—:— |d'':— |d'' :d'' |t :l |s :f |m:-.r |d :r |m :d'' |t :l |s : |:s |d'' :s |s :m |f :r |r :t_1 |d :— |—:—||","alto":":d |d :m |d :-.t_1 |d :r |d :— |r :d |t_1:— |—:— |m :— |f.m:r.d |t_1:-.d |r :m |d :— |—:— |m :— |m :m |r :r |d :t_1 |d :— |—:t_1 |d :m |r :d |t_1: |:t_1 |d :— |d :— |r :— |t_1:s_1 |s_1:— |—:—||","tenor":":m |m :s |s :— |—:s |m :— |l :s |s :— |—:— |s :— |s :d''.s |s :— |—:s |s :— |—:— |s :— |s :s |s :l |m :f |s:-.f |m :s |s :s |s :fe |s :l |s :f |m :— |m :s |l :f |f :r |m :— |—:—||","bass":":d |d :d |d :— |—:t_1 |l_1:— |f_1:— |s_1:— |—:— |d :— |f :f_1 |s_1:— |—:s_1 |d :— |—:— |d :— |m :d |s :f |m :r |d :— |—:s_1 |d :d |r :r |s :f |m :r |d :— |d :— |f_1:— |s_1:— |d_1:— |—:—||"}', 'X:1
T:New Lydia
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] c''2c''2f''2a3 | ga2c''2f4 | b2a2g8 | c''4d''c''ba | g3ab2c''2 | a8 | f''4f''2f''2 | e''2d''2c''2b2 | a3gf2g2 | a2f''2e''2d''2 | c''2c''2f''2c''2 | c''2a2b2g2 | g2e2f8
[V:2] f2f2a2f3 | ef2g2f4 | g2f2e8 | a4bagf | e3fg2a2 | f8 | a4a2a2 | g2g2f2e2 | f6e2 | f2a2g2f2 | e2e2f4 | f4g4 | e2c2c8
[V:3] a2a2c''2c''6 | c''2a4d''2 | c''2c''8 | c''4c''2f''c'' | c''6c''2 | c''8 | c''4c''2c''2 | c''2d''2a2b2 | c''3ba2c''2 | c''2c''2c''2=b2 | c''2d''2c''2b2 | a4a2c''2 | d''2b2b2g2 | a8
[V:4] f2f2f2f6 | e2d4B4 | c8 | f4b2B2 | c6c2 | f8 | f4a2f2 | c''2b2a2g2 | f6c2 | f2f2g2g2 | c''2b2a2g2 | f4f4 | B4c4 | F8', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:New Lydia
M:C
L:1/8
Q:1/4=76
K:F
c''2c''2f''2a3 | ga2c''2f4
% PHRASE_BREAK
 | b2a2g8 | c''4d''c''
% PHRASE_BREAK
ba | g3ab2c''2 | a8 |
f''4
% PHRASE_BREAK
f''2f''2 | e''2d''2c''2b2 | a3gf2g2 | a2f''2e''2d''2 | c''2c''2f''2c''2 | c''2a2b2g2 | g2e2f8
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (17, 'rec5hU8pFk3dTLL1q', 'Southwark', 'CM', 'X:1
T:Southwark
M:C
L:1/8
Q:1/4=76
K:A
e2a2b2c''2 | d''2e''3d''c''2
% PHRASE_BREAK
 | d''2c''3ba2 | a2g6
% PHRASE_BREAK
 |
b2b2^a2b2 | a2a2g2a2
% PHRASE_BREAK
 | c''2b2e''2d''2 | b2a6 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":s_1 |d :r |m :f |s :-.f |m :f |m :-.r |d :d |t_1 :- |- || :r |r :de |r :d |d :t_1 |d :m |r :s |f :r |d :- |- || d |d ||","alto":":s_1 |s_1 :s_1 |s_1 :l_1 |t_1 :-.t_1 |d :l_1 |s_1 :-.f_1 |m_1 :l_1 |s_1 :- |- || :t_1 |l_1 :s_1 |f_1 :l_1 |s_1 :f_1 |m_1 :d |t_1 :d |l_1 :t_1 |d :- |- || l_1 |s_1 ||","tenor":":m |m :r |d :d |r :-.r |d :d |d :-.t_1 |d :f |r :- |- || :s |m :m |f :f |r :r |d :s |s :-.d |r :f |m :- |- || f |m ||","bass":":d |d :t_1 |d :l_1 |s_1 :-.s_1 |d :f_1 |d :-.s_1 |l_1 :f_1 |s_1 :- |- || :s_1 |l_1 :l_1 |r_1 :f_1 |s_1 :s_1 |d_1 :d_1 |s_1 :m_1 |f_1 :s_1 |d :- |- || f_1 |d_1 ||"}', 'X:1
T:Southwark
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a2b2c''2 | d''2e''3d''c''2 | d''2c''3ba2 | a2g6 | b2b2^a2b2 | a2a2g2a2 | c''2b2e''2d''2 | b2a6 | a2a2
[V:2] e2e2e2e2 | f2g3ga2 | f2e3dc2 | f2e6 | g2f2e2d2 | f2e2d2c2 | a2g2a2f2 | g2a6 | f2e2
[V:3] c''2c''2b2a2 | a2b3ba2 | a2a3ga2 | d''2b6 | e''2c''2c''2d''2 | d''2b2b2a2 | e''2e''3ab2 | d''2c''6 | d''2c''2
[V:4] a2a2g2a2 | f2e3ea2 | d2a3ef2 | d2e6 | e2f2f2B2 | d2e2e2A2 | A2e2c2d2 | e2a6 | d2A2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Southwark
M:C
L:1/8
Q:1/4=76
K:A
e2a2b2c''2 | d''2e''3d''c''2
% PHRASE_BREAK
 | d''2c''3ba2 | a2g6
% PHRASE_BREAK
 |
b2b2^a2b2 | a2a2g2a2
% PHRASE_BREAK
 | c''2b2e''2d''2 | b2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (29, 'rec8qvJH4Mp4i5VoP', 'Old 100th', 'LM (long meter, 88 88)', 'X:1
T:Old 100th
M:C
L:1/8
K:A
a4a2g2 | f2e2a4 | b4c''4 | c''4c''2c''2 | b2a2d''4 | c''4b4 | a4b2c''2 | b2a2f4 | g4a4 | e''4c''2a2 | b2d''2c''4 | b4a4 | a2a2', NULL, '{"doh":"A","time":"C","soprano":"|d :— |d :t_1 |l_1 :s_1 |d :— |r :— |m :— |m :— |m :m |r :d |f :— |m :— |r :—|| |d :— |r :m |r :d |l_1 :— |t_1 :— |d :— |s :— |m :d |r :f |m :— |r :— |d :—|| d | d||","alto":"|s_1 :— |s_1 :s_1 |m_1 :m_1 |m_1 :— |s_1 :— |s_1 :— |s_1 :— |s_1 :s_1 |s_1 :m_1 |l_1 :— |s_1 :— |s_1 :—|| |s_1 :— |s_1 :s_1 |s_1 :m_1 |f_1 :— |f_1 :— |m_1 :— |s_1 :— |s_1 :fe_1 |s_1 :l_1 |s_1 :— |— :f_1 |m_1 :—|| f_1 | m_1||","tenor":"|m :— |m :r |d :t_1 |l_1 :— |t_1 :— |d :— |d :— |d :d |t_1 :d |d :— |d :— |t_1 :—|| |m :— |r :d |t_1 :d |d :— |r :— |s_1 :— |r :— |d :d |t_1 :d |d :— |t_1 :— |d :—|| l_1 | s_1||","bass":"|d :— |d :s_1 |l_1 :m_1 |l_1 :— |s_1 :— |d_1 :— |d :— |d :d |s_1 :l_1 |f_1 :— |d_1 :— |s_1 :—|| |d :— |t_1 :d |s_1 :l_1 |f_1 :— |r_1 :— |d_1 :— |t_1 :— |d :l_1 |s_1 :f_1 |s_1 :— |s_1 :— |d_1 :—|| f_1 | d_1||"}', 'X:1
T:Old 100th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a4a2g2 | f2e2a4 | b4c''4 | c''4c''2c''2 | b2a2d''4 | c''4b4 | a4b2c''2 | b2a2f4 | g4a4 | e''4c''2a2 | b2d''2c''4 | b4a4 | a2a2
[V:2] e4e2e2 | c2c2c4 | e4e4 | e4e2e2 | e2c2f4 | e4e4 | e4e2e2 | e2c2d4 | d4c4 | e4e2^d2 | e2f2e6 | d2c4d2 | c2
[V:3] c''4c''2b2 | a2g2f4 | g4a4 | a4a2a2 | g2a2a4 | a4g4 | c''4b2a2 | g2a2a4 | b4e4 | b4a2a2 | g2a2a4 | g4a4 | f2e2
[V:4] a4a2e2 | f2c2f4 | e4A4 | a4a2a2 | e2f2d4 | A4e4 | a4g2a2 | e2f2d4 | B4A4 | g4a2f2 | e2d2e4 | e4A4 | d2A2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Old 100th
C:Genevan Psalter 1551
M:C
L:1/4
Q:1/4=80
K:G
G G A G | F E D2 | E
% PHRASE_BREAK
 F G A | G3 z |
G A B c
% PHRASE_BREAK
 | d c B2 | c d e d | c3
% PHRASE_BREAK
 z |
d d c B | A G A2 | B c d B | G3 z |
G A B G | c B A2 | G F E G | D3 z |
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (9, 'rec2s6BCK4hB0dpGo', 'Moravia', 'CM', 'X:1
T:Moravia
M:C
L:1/8
Q:1/4=76
K:G
g2g2d''2b2 | g2g2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 |
a2g6
% PHRASE_BREAK
 | b2d''2c''2b2 | g2g2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 | a2g6
', NULL, '{"doh":"G","time":"C","soprano":":d | d :s | m :d | d :m | r :m | s :f | m :r | d :— | — || :m | s :f | m :d | d :m | r :m | s :f | m :r | d :— | — ||","alto":":s_1 | l_1 :s_1 | s_1 :s_1 | l_1 :s_1 | s_1 :s_1 | d :d | d :t_1 | d :— | — || :d | s_1 :s_1 | s_1 :s_1 | l_1 :s_1 | s_1 :s_1 | ta_1 :l_1 | s_1 :-f_1 | m_1 :— | — ||","tenor":":m | m :r | d :d | d :d | t_1 :d | d :l | s :s.f | m :— | — || :d | r :t_1 | d :d | d :d | t_1 :d | d :d | d :t_1 | d :— | — ||","bass":":d | l_1 :t_1 | d :m_1 | f_1 :d_1 | s_1 :d_1 | m_1 :f_1 | s_1 :s_1 | d :— | — || :l_1 | t_1 :s_1 | d :m_1 | f_1 :d_1 | s_1 :d | m_1 :f_1 | s_1 :s_1 | d_1 :— | — ||"}', 'X:1
T:Moravia
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2g2d''2b2 | g2g2b2a2 | b2d''2c''2b2 | a2g6 | b2d''2c''2b2 | g2g2b2a2 | b2d''2c''2b2 | a2g6
[V:2] d2e2d2d2 | d2e2d2d2 | d2g2g2g2 | f2g6 | g2d2d2d2 | d2e2d2d2 | d2=f2e2d2 | z2B6
[V:3] b2b2a2g2 | g2g2g2f2 | g2g2e''2d''2 | d''c''b6 | g2a2f2g2 | g2g2g2f2 | g2g2g2g2 | f2g6
[V:4] g2e2f2g2 | B2c2G2d2 | G2B2c2d2 | d2g6 | e2f2d2g2 | B2c2G2d2 | g2B2c2d2 | d2G6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Moravia
M:C
L:1/8
Q:1/4=76
K:G
g2g2d''2b2 | g2g2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 |
a2g6
% PHRASE_BREAK
 | b2d''2c''2b2 | g2g2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 | a2g6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (19, 'rec6K0cyMZzV1SsLS', 'St. Magnus', 'CM', 'X:1
T:St. Magnus
M:C
L:1/8
Q:1/4=76
K:G
d2g2a2f2 | d2g2a2b2
% PHRASE_BREAK
 | a2b2g2b2 | ^c''2d''6
% PHRASE_BREAK
 |
a2b2a2g2 | f2e2a2f2
% PHRASE_BREAK
 | d2d''2d''c''b2 | a2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":s_1 |d :r |t_1 :s_1 |d :r |m :r |m :d |m :fe |s :— |— || :r |m :r |d :t_1 |l_1 :r |t_1 :s_1 |s :s.f |m :r |d :— |— || d |d ||","alto":":s_1 |l_1 :l_1 |s_1 :s_1 |s_1 :s_1 |s_1 :t_1 |d :d |d :d |t_1 :— |— || :t_1 |d :t_1 |l_1 :s_1 |f_1 :l_1 |s_1 :s_1 |s_1 :l_1 |s_1 :-.f_1 |m_1 :— |— || f_1 |m_1 ||","tenor":":m |m :f |r :t_1 |d :t_1 |d :s |s :s |s :d |r :— |— || :s |s :s |m :m |d :f |r :t_1 |d :d |d :t_1 |d :— |— || l_1 |s_1 ||","bass":":d |l_1 :f_1 |s_1 :s_1 |m_1 :s_1 |d :s_1 |d :m |d :l_1 |s_1 :— |— || :s_1 |d :s_1 |l_1 :m_1 |f_1 :r_1 |s_1 :f_1 |m_1 :f_1 |s_1 :s_1 |d_1 :— |— || f_1 |d_1 ||"}', 'X:1
T:St. Magnus
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2g2a2f2 | d2g2a2b2 | a2b2g2b2 | ^c''2d''6 | a2b2a2g2 | f2e2a2f2 | d2d''2d''c''b2 | a2g6 | g2g2
[V:2] d2e2e2d2 | d2d2d2d2 | f2g2g2g2 | g2f6 | f2g2f2e2 | d2c2e2d2 | d2d2e2d3 | cB6c2 | B2
[V:3] b2b2c''2a2 | f2g2f2g2 | d''2d''2d''2d''2 | g2a6 | d''2d''2d''2b2 | b2g2c''2a2 | f2g2g2g2 | f2g6 | e2d2
[V:4] g2e2c2d2 | d2B2d2g2 | d2g2b2g2 | e2d6 | d2g2d2e2 | B2c2A2d2 | c2B2c2d2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/Vv1YFU0lou8?si=RCYVCF1bVuOCTNkW', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Magnus
M:C
L:1/8
Q:1/4=76
K:G
d2g2a2f2 | d2g2a2b2
% PHRASE_BREAK
 | a2b2g2b2 | ^c''2d''6
% PHRASE_BREAK
 |
a2b2a2g2 | f2e2a2f2
% PHRASE_BREAK
 | d2d''2d''c''b2 | a2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (15, 'rec5cINm7ePbaUs0S', 'Newington', 'CM', 'X:1
T:Newington
M:C
L:1/8
Q:1/4=76
K:A
a2e''2c''2a2 | bag2a2
% PHRASE_BREAK
b2 | c''d''e''2ab
% PHRASE_BREAK
c''2 | b2a6 |
c''2d''2b2c''2 | d''2
% PHRASE_BREAK
e''2bag2 | f2e2abc''2 | b2a6 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":d |s :m |d :r.d |t_1 :d |r :m.f |s :d.r |m :r |d :— |—|| :m |f :r |m :f |s :r.d |t_1 :l_1 |s_1 :d.r |m :r |d :— |—|| d |d ||","alto":":s_1 |s_1 :s_1 |l_1 :l_1 |s_1 :-.fe_1 |s_1 :s_1.l_1 |s_1 :l_1 |s_1 :-.f_1 |m_1 :— |—|| :s_1 |l_1 :s_1 |s_1 :l_1 |s_1 :l_1 |s_1 :fe_1 |s_1.f_1 :m_1.l_1 |s_1 :f_1 |m_1 :— |—|| f_1 |m_1 ||","tenor":":m |r :d |m :f |r :d |t_1 :d |d :d |d :t_1 |d :— |—|| :d |d :t_1 |d :d |d :f.m |r :r |r :d |d :t_1 |d :— |—|| l_1 |s_1 ||","bass":":d |t_1 :d |l_1 :f_1 |s_1 :l_1 |s_1 :d.l_1 |m_1 :f_1 |s_1 :s_1 |d_1 :— |—|| :d |f_1 :s_1 |d :l_1 |m_1 :f_1 |s_1 :l_1 |t_1 :d.f_1 |s_1 :s_1 |d_1 :— |—|| f_1 |d_1 ||"}', 'X:1
T:Newington
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2e''2c''2a2 | bag2a2b2 | c''d''e''2abc''2 | b2a6 | c''2d''2b2c''2 | d''2e''2bag2 | f2e2abc''2 | b2a6 | a2a2
[V:2] e2e2e2f2 | f2e3^de2 | efe2f2e3 | dc6e2 | f2e2e2f2 | e2f2e2^d2 | edcfe2d2 | c6d2 | c2
[V:3] c''2b2a2c''2 | d''2b2a2g2 | a2a2a2a2 | g2a6 | a2a2g2a2 | a2a2d''c''b2 | b2b2a2a2 | g2a6 | f2e2
[V:4] a2g2a2f2 | d2e2f2e2 | afc2d2e2 | e2A6 | a2d2e2a2 | f2c2d2e2 | f2g2ade2 | e2A6 | d2A2', NULL, NULL, NULL, 'https://youtu.be/7ZpqzkUDmuM?si=zdc3vqh24M0IyGOp', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Newington
M:C
L:1/8
Q:1/4=76
K:A
a2e''2c''2a2 | bag2a2
% PHRASE_BREAK
b2 | c''d''e''2ab
% PHRASE_BREAK
c''2 | b2a6 |
c''2d''2b2c''2 | d''2
% PHRASE_BREAK
e''2bag2 | f2e2abc''2 | b2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (10, 'rec3U93xb8zM8HEOx', 'Arnold', 'CM', 'X:1
T:Arnold
M:C
L:1/8
K:F
c''2c''2a2c''2 | b2g2b2a2 | b2a2g4 | g2a2b2c''2 | dc''b2a2g4 | de''f''2d''2c''2 | a2c''2de''f''2 | d''2c''4c''2 | d''2e''2f''c''b2 | a2g2f4 | f2f2', NULL, '{"doh":"F","time":"C","soprano":":s |s :m :s |f :r :f |m :f :m |r :— :r |m :f :s |l_1,s :f :m |r :—|| l_1,t:d'' :l |s :m :s |l_1,t:d'' :l |s :— :s |l :t :d''.s |f :m :r |d :—|| d | d ||","alto":":m |m :d :m |r :t_1 :r |d :r :d |t_1 :— :t_1 |d :— :d |d :— :d |t_1 :—|| d :— :d |d :— :d |d :— :d |d :— :d |d :f :m |r :d :t_1 |d :—|| l_1 | s_1 ||","tenor":":s |s :— :s |s :— :s |s :— :s |s :— :s |s :f :m |f_1,s :l :s |s :—|| f_1,s :l :f |s :— :m |f_1,s :l :f |m :— :s |f :— :s |l :s :f |m :—|| f | m ||","bass":":d |d :— :d |s_1 :— :t_1 |d :t_1 :d |s_1 :— :s_1 |d :l_1 :s_1 |f_1 :— :d |s_1 :—|| f :— :f |m :d :d |f :— :f_1 |d :— :m |f :r :d |f :s :s_1 |d :—|| f_1 | d ||"}', 'X:1
T:Arnold
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] c''2c''2a2c''2 | b2g2b2a2 | b2a2g4 | g2a2b2c''2 | z2b2a2g4 | z2f''2d''2c''2 | a2c''2z2f''2 | d''2c''4c''2 | d''2e''2f''c''b2 | a2g2f4 | f2f2
[V:2] a2a2f2a2 | g2e2g2f2 | g2f2e4 | e2f4f2 | f4f2e4 | f4f2f4 | f2f4f2 | f4f2f2 | b2a2g2f2 | e2f4d2 | c2
[V:3] c''2c''4c''2 | c''4c''2c''4 | c''2c''4c''2 | c''2b2a2z2 | d''2c''2c''4 | z2d''2b2c''4 | a2z2d''2b2 | a4c''2b4 | c''2d''2c''2b2 | a4b2a2
[V:4] f2f4f2 | c4e2f2 | e2f2c4 | c2f2d2c2 | B4f2c4 | b4b2a2 | f2f2b4 | B2f4a2 | b2g2f2b2 | c''2c2f4 | B2f2', NULL, NULL, NULL, 'https://youtu.be/6Fvh2lO5xzo?si=E4q7x25nLsV76dpz', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Arnold
M:C
L:1/8
Q:1/4=76
K:F
c''2c''2a2c''2 | b2g2b2a2
% PHRASE_BREAK
 | b2a2g4 | g2a2b2
% PHRASE_BREAK
c''2 | z2b2a2g4 |
z2f''2d''2c''2 | a2
% PHRASE_BREAK
c''2z2f''2 | d''2c''4c''2 | d''2e''2f''c''b2 | a2g2f4 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (128, 'recjbkYvxw8Mb7pTS', 'Azmon/Denfield', 'CM', 'X:1
T:Azmon/Denfield
M:C
L:1/8
K:Ab
E2AAB2B2 | cBA2B2cc | d2c2B4 | e2ecc2A2 | AFF2E2EA | A2G2A4', NULL, '{"doh":"Ab","time":"C","soprano":":s_1 |d.d :r :r |m.r :d :r |m.m :f :m |r :—|| :s |s.m :m :d |d.l_1 :l_1 :s_1 |s_1.d :d :t_1 |d :—||","alto":":m_1 |m_1.s_1 :s_1 :s_1 |s_1.f_1 :m_1 :s_1 |s_1.s_1 :s_1 :s_1 |s_1 :—|| :t_1 |d.s_1 :s_1 :s_1 |l_1.f_1 :f_1 :m_1 |s_1.s_1 :s_1 :s_1 |s_1 :—||","tenor":":d |d.d :t_1 :t_1 |d.t_1 :d :t_1 |d.d :r :d |t_1 :—|| :r |m.d :d :d |d.d :d :d |d.m :r :r.f |m :—||","bass":":d_1 |d_1.m_1 :s_1 :s_1 |d.s_1 :d_1 :s_1 |d.d :t_1 :d |s_1 :—|| :s_1 |d.d :d :m_1 |f_1.f_1 :f_1 :d_1 |m_1.d_1 :s_1 :s_1 |d_1 :—||"}', 'X:1
T:Azmon/Denfield
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] E2AAB2B2 | cBA2B2cc | d2c2B4 | e2ecc2A2 | AFF2E2EA | A2G2A4
[V:2] C2CEE2E2 | EDC2E2EE | E2E2E4 | G2AEE2E2 | FDD2C2EE | E2E2E4
[V:3] A2AAG2G2 | AGA2G2AA | B2A2G4 | B2cAA2A2 | AAA2A2Ac | B2Bdc4
[V:4] A,2A,CE2E2 | AEA,2E2AA | G2A2E4 | E2AAA2C2 | DDD2A,2CA, | E2E2A,4', NULL, NULL, NULL, 'https://youtu.be/UPm1IXF5YFE?si=3arNPdMHIxmumfvz', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Azmon/Denfield
M:C
L:1/8
Q:1/4=76
K:Ab
E2AAB2B2 | cBA2
% PHRASE_BREAK
B2cc |
d2c2B4
% PHRASE_BREAK
 | e2ecc2A2 | AFF2
% PHRASE_BREAK
E2EA | A2G2A4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (32, 'recAGj8c0QZvlH64E', 'Huddersfield', 'CM', 'X:1
T:Huddersfield
M:C
L:1/8
Q:1/4=76
K:F
f2c''4d''2 | c''4f2b2 | a2g2
% PHRASE_BREAK
f4 | e2f4g2 | ac''
% PHRASE_BREAK
b2a2a2 |
g2c''2agf2
% PHRASE_BREAK
 | f''2d''2c''2a2 | bag2f2a2 | g2c''2f2g2 | a2b2a2g2 | f4f2f2
', NULL, '{"doh":"F","time":"C","soprano":":d |s :— :l |s :— :d |f :m :r |d :— :t_1 |d :— :r |m.s:f :m |m :r ||:s |m.,r:d :d'' |l :s :m |f.,m:r :d |m :r :s |d :r :m |f :m :r |d :— ||d |d ||","alto":":d |d :— :d |d :— :d |d :— :t_1 |d :— :s_1 |s_1 :— :t_1 |d.m:r :d |d :t_1 ||:t_1 |d :— :d |d :— :d |t_1.,d:s_1 :l_1 |d :t_1 :t_1 |d :s_1 :s_1.d |d :— :t_1 |d :— ||d |s_1 ||","tenor":":m |m :— :f |m :— :m |l :s :f |m :— :s |s :— :s |s :— :s |s :— ||:s |s.,f:m :s |f :s :s |s :— :fe |s :— :s.f |m :r :d |d :— :t_1 |d :— ||l_1 |s_1 ||","bass":":d |d :— :d |d :— :l_1 |f_1 :s_1 :s_1 |d :— :s.f |m :— :r |d :t_1 :d |s_1 :— ||:s_1 |d :— :m |f :m :d |r.,d:t_1 :l_1 |s_1 :— :s_1 |l_1 :t_1 :d |f_1 :s_1 :s_1 |d :— ||f_1 |d ||"}', 'X:1
T:Huddersfield
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2c''4d''2 | c''4f2b2 | a2g2f4 | e2f4g2 | ac''b2a2a2 | g2c''2agf2 | f''2d''2c''2a2 | bag2f2a2 | g2c''2f2g2 | a2b2a2g2 | f4f2f2
[V:2] f2f4f2 | f4f2f4 | e2f4c2 | c4e2fa | g2f2f2e2 | e2f4f2 | f4f2ef | c2d2f2e2 | e2f2c2cf | f4e2f4 | f2c2
[V:3] a2a4b2 | a4a2d''2 | c''2b2a4 | c''2c''4c''2 | c''4c''2c''4 | c''2c''ba2c''2 | b2c''2c''2c''4 | =b2c''4c''_b | a2g2f2f4 | e2f4d2 | c2
[V:4] f2f4f2 | f4d2B2 | c2c2f4 | c''ba4g2 | f2e2f2c4 | c2f4a2 | b2a2f2gf | e2d2c4 | c2d2e2f2 | B2c2c2f4 | B2f2', NULL, NULL, NULL, 'https://youtu.be/c_3gUCZ7Erc?si=gptKx7Wouz_nn4Xx', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Huddersfield
M:C
L:1/8
Q:1/4=76
K:F
f2c''4d''2 | c''4f2b2 | a2g2
% PHRASE_BREAK
f4 | e2f4g2 | ac''
% PHRASE_BREAK
b2a2a2 |
g2c''2agf2
% PHRASE_BREAK
 | f''2d''2c''2a2 | bag2f2a2 | g2c''2f2g2 | a2b2a2g2 | f4f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (26, 'rec7qEqz3rREAbV5U', 'Aurelia', '76 76 D', 'X:1
T:Aurelia
M:C
L:1/8
Q:1/4=76
K:Eb
e2e2e2=e2 | e2e4_d2 | =B2=B2a2_g2 | =e2_e6 | =e2_g2=b2=b2 | b2b4a2 | _g2=e2_g2_e2 | =B2_d6 | _d2e2=e2_g2 | a2a4_g2 | =b2=b3_ba2 | e2=e6 | _d2e2e2=e2 | e2e4_d2 | =B2=B2_d2=B2 | B2=B6', NULL, '{"doh":"Eb","time":"C","soprano":":m |m :m |f :m |m :— |r :d |d :l |s :f |m :— |— || :f |s :d'' |d'' :t |t :— |l :s |f :s |m :d |r :— |— || :r |m :f |s :l |l :— |s :d'' |d'' :—.t |l :m |f :— |— || :r |m :m |f :m |m :— |r :d |d :r |d :t_1 |d :— |— ||","alto":":d |d :d |d :d |d :— |t_1 :d |l_1 :d |d :t_1 |d :— |— || :t_1 |d :d |d :r |r :— |d :m |m :r |d :d |t_1 :— |— || :t_1 |d :t_1 |d :d |d :— |d :m |m :—.m |m :m |r :— |— || :r |d :d |d :d |l_1 :— |l_1 :l_1 |l_1 :l_1 |s_1 :s_1 |s_1 :— |— ||","tenor":":s |s :s |l :s |s :— |s :s |r :r |m :s |s :— |— || :s |s :s |se :se |se :— |l :t |d'' :r'' |s :fe |s :— |— || :s |s :s |s :f |f :— |s :l |l :—.se |l :l |l :— |— || :s |s :s |l :s |s :— |f :f |f :f |r :f |m :— |— ||","bass":":d |d :d |d :d |s_1 :— |f_1 :m_1 |f_1 :f_1 |s_1 :s_1 |d :— |— || :r |m :m |m :m_1 |f_1 :— |f_1 :s_1 |l_1 :t_1 |d :l_1 |s_1 :— |— || :s_1 |d :r |m :f |f :— |m :l_1 |m :—.r |d :de |r :— |— || :t_1 |d :d |d :d |f_1 :— |f_1 :f_1 |r_1 :r_1 |s_1 :s_1 |d :— |— ||"}', 'X:1
T:Aurelia
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e2e2e2=e2 | e2e4_d2 | =B2=B2a2_g2 | =e2_e6 | =e2_g2=b2=b2 | b2b4a2 | _g2=e2_g2_e2 | =B2_d6 | _d2e2=e2_g2 | a2a4_g2 | =b2=b3_ba2 | e2=e6 | _d2e2e2=e2 | e2e4_d2 | =B2=B2_d2=B2 | B2=B6
[V:2] =B2=B2=B2=B2 | =B2=B4_B2 | =B2A2=B2=B2 | B2=B6 | B2=B2=B2=B2 | _d2_d4=B2 | e2e2_d2=B2 | =B2_B6 | B2=B2_B2=B2 | =B2=B4=B2 | e2e3ee2 | e2_d6 | _d2=B2=B2=B2 | =B2A4A2 | A2A2A2_G2 | _G2_G6
[V:3] _g2_g2_g2a2 | _g2_g4_g2 | _g2_d2_d2e2 | _g2_g6 | _g2_g2_g2=g2 | g2g4a2 | b2=b2_d''2_g2 | f2_g6 | _g2_g2_g2_g2 | =e2=e4_g2 | a2a3ga2 | a2a6 | _g2_g2_g2a2 | _g2_g4=e2 | =e2=e2=e2_d2 | =e2_e6
[V:4] =B2=B2=B2=B2 | =B2_G4=E2 | E2=E2=E2_G2 | _G2=B6 | _d2e2e2e2 | E2=E4=E2 | _G2A2B2=B2 | A2_G6 | _G2=B2_d2e2 | =e2=e4_e2 | A2e3_d=B2 | c2_d6 | B2=B2=B2=B2 | =B2=E4=E2 | =E2_D2_D2_G2 | _G2=B6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=o7nFWtqLqN4&ab_channel=nanciekoo', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Aurelia
M:C
L:1/8
Q:1/4=76
K:Eb
e2e2e2=e2 | e2e4_d2 | =B2=B2a2_g2 | =e2_e6 | =e2_g2=b2=b2 | b2b4a2 | _g2=e2_g2_e2 | =B2_d6 | _d2e2=e2_g2 | a2a4_g2 | =b2=b3_ba2 | e2=e6 | _d2e2e2=e2 | e2e4_d2 | =B2=B2_d2=B2 | B2=B6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (37, 'recEuzvXk2bLPKMTG', 'Coleshill', 'CM', 'X:1
T:Coleshill
M:C
L:1/8
Q:1/4=76
K:Am
a2a2g2c''2 | g2a2a2e2
% PHRASE_BREAK
 | c''2e''2d''2c''2 | g2c''6
% PHRASE_BREAK
 |
c''2e''2d''2c''2 | g2a2a2e2
% PHRASE_BREAK
 | c''2g2a2d''c'' | b2a6 | a2a2
', NULL, '{"doh":"C","time":"C","soprano":":l |l :s |d'' :s |l :l |m :d'' |m'' :r'' |d'' :s |d'' :— |—|| :d'' |m'' :r'' |d'' :s |l :l |m :d'' |s :l |r''.d'':t |l :— |—|| l |l ||","alto":":m |f :r |s :m |d :d |d :m |s :f |m :r |m :— |—|| :s |s :s |m :d |d :d |d :m |m.r:d |f.m:r |d :— |—|| r |de ||","tenor":":d'' |d'' :t |d'' :d'' |l :f |s :s |d'' :l |s :t |d'' :— |—|| :m'' |d'' :t |d'' :d'' |l :f |s :d'' |t :l |l :se |l :— |—|| f |m ||","bass":":l |f :s |m :d |f :f |d :d |d :r |m :s |d :— |—|| :d |d'' :s |l :m |f :f |d :d |m :f |r :m |l_1 :— |—|| r |l_1 ||","lah":"A","mode":"minor"}', 'X:1
T:Coleshill
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Am
[V:1] a2a2g2c''2 | g2a2a2e2 | c''2e''2d''2c''2 | g2c''6 | c''2e''2d''2c''2 | g2a2a2e2 | c''2g2a2d''c'' | b2a6 | a2a2
[V:2] e2f2d2g2 | e2c2c2c2 | e2g2f2e2 | d2e6 | g2g2g2e2 | c2c2c2c2 | e2edc2fe | d2c6 | d2^c2
[V:3] c''2c''2b2c''2 | c''2a2f2g2 | g2c''2a2g2 | b2c''6 | e''2c''2b2c''2 | c''2a2f2g2 | c''2b2a2a2 | ^g2a6 | f2e2
[V:4] a2f2g2e2 | c2f2f2c2 | c2c2d2e2 | g2c6 | c2c''2g2a2 | e2f2f2c2 | c2e2f2d2 | e2A6 | d2A2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=DuAqw2oWAnc&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Coleshill
M:C
L:1/8
Q:1/4=76
K:Am
a2a2g2c''2 | g2a2a2e2
% PHRASE_BREAK
 | c''2e''2d''2c''2 | g2c''6
% PHRASE_BREAK
 |
c''2e''2d''2c''2 | g2a2a2e2
% PHRASE_BREAK
 | c''2g2a2d''c'' | b2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (38, 'recEvrz00ZIUxzQNH', 'Old 124th', '10 10 10 10 10', 'X:1
T:Old 124th
M:C
L:1/8
Q:1/4=76
K:G
g2abc''2b2 | aggfg4 | b2c''d''e''2d''2 | c''bagf4 | d2ggf2g2 | ac''bab4 | d''2d''c''b2a2 | bd''d''^c''d''4 | b2agfgac'' | b2a2g4 | g2g2', NULL, '{"doh":"G","time":"C","soprano":"d :r.m | f :m | r.d :d.t_1 | d :— || m :f.s | l :s | f.m :r.d | t_1 :— || s_1 :d.d | t_1 :d | r.f :m.r | m :— || s :s.f | m :r | m.s :s.fe | s :— || m :r.d | t_1.d :r.f | m :r | d :— || d | d ||","alto":"d :t_1.d | d :d | l_1.s_1 :l_1.s_1 | s_1 :— || d :d.d | d :d | t_1.d :l_1.l_1 | s_1 :— || s_1 :s_1.s_1 | s_1 :s_1 | l_1.l_1 :s_1.s_1 | s_1 :— || d :d.t_1 | d :t_1 | d.d :l_1.t_1.d | t_1 :— || d :t_1.l_1 | se_1.l_1 :l_1.l_1 | s_1 :—.f_1 | m_1 :— || f_1 | m_1 ||","tenor":"m :s.s | l :s | f.m :r.r | m :— || s :f.m | f :m | f.s :r.r | r :— || t_1 :d.m | r :d | d.d :d.t_1 | d :— || m :s.s | s :s | s.s :l.r | r :— || d :s.m | m.d :d.d | d :t_1 | d :— || l_1 | s_1 ||","bass":"d :s_1.d | f_1 :d_1 | r_1.m_1 :f_1.s_1 | d_1 :— || d :l_1.s_1 | f_1 :d_1 | r_1.m_1 :f_1.fe_1 | s_1 :— || s_1 :m_1.d_1 | s_1 :m_1 | f_1.r_1 :s_1.s_1 | d_1 :— || d :m.r | d :s_1 | d.m :r.r_1 | s_1 :— || d :s_1.l_1 | m_1.l_1 :f_1.r_1 | s_1 :s_1 | d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Old 124th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2abc''2b2 | aggfg4 | b2c''d''e''2d''2 | c''bagf4 | d2ggf2g2 | ac''bab4 | d''2d''c''b2a2 | bd''d''^c''d''4 | b2agfgac'' | b2a2g4 | g2g2
[V:2] g2fgg2g2 | ededd4 | g2ggg2g2 | fgeed4 | d2ddd2d2 | eeddd4 | g2gfg2f2 | ggefgf4 | g2fe^deee | d3cB4 | c2B2
[V:3] b2d''d''e''2d''2 | c''baab4 | d''2c''bc''2b2 | c''d''aaa4 | f2gba2g2 | gggfg4 | b2d''d''d''2d''2 | d''d''e''aa4 | g2d''bbggg | g2f2g4 | e2d2
[V:4] g2dgc2G2 | ABcdG4 | g2edc2G2 | ABc^cd4 | d2BGd2B2 | cAddG4 | g2bag2d2 | gbaAd4 | g2deBecA | d2d2G4 | c2G2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=k1altzjDnVI&ab_channel=WestminsterCovenanter', NULL, 'Ps 124 "Now Israel may say and that truly..."', false, false, NULL, NULL, NULL, true, 'X:1
T:Old 124th
M:C
L:1/8
Q:1/4=76
K:G
g2abc''2b2 | aggfg4 | b2c''d''e''2d''2 | c''bagf4 | d2ggf2g2 | ac''bab4 | d''2d''c''b2a2 | bd''d''^c''d''4 | b2agfgac'' | b2a2g4 | g2g2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (23, 'rec6pKivYRUXeAtVK', 'Belgrave', 'CM', 'X:1
T:Belgrave
M:C
L:1/8
Q:1/4=76
K:E
b2g4b2 | e''4g2a2 | b2c''2
% PHRASE_BREAK
f4 | bag2^a2b
% PHRASE_BREAK
c'' |
d''4c''2b4 | e''2g4c''2 | f4
% PHRASE_BREAK
b2e2 | f2g2g2f2 | b2b2a2g2 | gfe2d2e4
', NULL, '{"doh":"E","time":"C","soprano":":s |m :- :s |d'' :- :m |f :s :l |r :- :s.f |m :fe :s.l |t :- :l |s :-|| :d'' |m :- :l |r :- :s |d :r :m |m :r :s |s :f :m |m.r :d :t_1 |d :-||","alto":":d |d :- :r |d :- :d |d :- :d |t_1 :- :r |d :- :r.m |r :- :r.d |t_1 :-|| :d |d :- :d |t_1 :- :d |l_1 :t_1 :d |d :t_1 :t_1 |d :r :d |l_1 :s_1 :s_1 |s_1 :-||","tenor":":m |s :- :s |m :- :s |f :m :r |s :- :s |s :l :s |s :- :fe |s :-|| :s |d'' :t :l |t :l :s |l :f :s |s :- :r |d :s :s |f :m :r |m :-||","bass":":d |d :- :t_1 |l_1 :- :ta_1 |l_1 :s_1 :f_1 |s_1 :- :t_1 |d :l_1 :t_1.d |r :- :r |s_1 :-|| :m |l :s :f |s :f :m |f :r :d |s :- :s_1 |l_1 :t_1 :d |f_1 :s_1 :s_1 |d :-||"}', 'X:1
T:Belgrave
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] b2g4b2 | e''4g2a2 | b2c''2f4 | bag2^a2bc'' | d''4c''2b4 | e''2g4c''2 | f4b2e2 | f2g2g2f2 | b2b2a2g2 | gfe2d2e4
[V:2] e2e4f2 | e4e2e4 | e2d4f2 | e4fgf4 | fed4e2 | e4e2d4 | e2c2d2e2 | e2d2d2e2 | f2e2c2B2 | B2B4
[V:3] g2b4b2 | g4b2a2 | g2f2b4 | b2b2c''2b2 | b4^a2b4 | b2e''2d''2c''2 | d''2c''2b2c''2 | a2b2b4 | f2e2b2b2 | a2g2f2g4
[V:4] e2e4d2 | c4=d2c2 | B2A2B4 | d2e2c2de | f4f2B4 | g2c''2b2a2 | b2a2g2a2 | f2e2b4 | B2c2d2e2 | A2B2B2e4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=-aBRcdD8noo&ab_channel=WisconsinOliveGrove', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Belgrave
M:C
L:1/8
Q:1/4=76
K:E
b2g4b2 | e''4g2a2 | b2c''2
% PHRASE_BREAK
f4 | bag2^a2b
% PHRASE_BREAK
c'' |
d''4c''2b4 | e''2g4c''2 | f4
% PHRASE_BREAK
b2e2 | f2g2g2f2 | b2b2a2g2 | gfe2d2e4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (155, 'rectIMoB1Clj5Fc0C', 'St Agnes, Durham (start high)', 'CM', 'X:1
T:St Agnes, Durham (start high)
M:C
L:1/8
Q:1/4=76
K:G
b2b2b2a4 | b2c''4f2 | g6
% PHRASE_BREAK
d2 | d2d2b4 | a2a6
% PHRASE_BREAK
 |
c''2c''2b2a4 | g2f4e2 | d6
% PHRASE_BREAK
d2 | e2g2b4 | a2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":"m :m :m | r :— :m | f :— :t_1 | d :— :— | s_1 :s_1 :s_1 | m :— :r | r :— :— || f :f :m | r :— :d | t_1 :— :l_1 | s_1 :— :— | s_1 :l_1 :d | m :— :r | d :— :— || d | d ||","alto":"s_1 :s_1 :s_1 | l_1 :— :s_1 | f_1 :l_1 :s_1 | s_1 :— :— | s_1 :s_1 :s_1 | s_1 :— :fe_1 | s_1 :— :— || l_1 :l_1 :s_1 | f_1 :— :fe_1 | s_1 :— :fe_1 | s_1 :— :— | s_1 :s_1 :f_1 | m_1 :— :f_1 | m_1 :— :— || f_1 | m_1 ||","tenor":"m :m :d | f :— :d | r :— :r | m :— :— | f :m :r | d :— :d | t_1 :— :— || l_1 :t_1 :de | r :— :r | r :— :d | t_1 :— :— | d :d :d | d :— :t_1 | d :— :— || l_1 | s_1 ||","bass":"d :d :m_1 | f_1 :— :m_1 | r_1 :— :s_1 | d :— :— | r :d :t_1 | d :— :l_1 | s_1 :— :— || r_1 :r_1 :r_1 | r_1 :— :r_1 | s_1 :— :s_1 | s_1 :— :f_1 | m_1 :f_1 :l_1 | s_1 :— :s_1 | d_1 :— :— || f_1 | d_1 ||"}', 'X:1
T:St Agnes, Durham (start high)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] b2b2b2a4 | b2c''4f2 | g6d2 | d2d2b4 | a2a6 | c''2c''2b2a4 | g2f4e2 | d6d2 | e2g2b4 | a2g6 | g2g2
[V:2] d2d2d2e4 | d2c2e2d2 | d6d2 | d2d2d4 | ^c2d6 | e2e2d2c4 | ^c2d4^c2 | d6d2 | d2c2B4 | c2B6 | c2B2
[V:3] b2b2g2c''4 | g2a4a2 | b6c''2 | b2a2g4 | g2f6 | e2f2^g2a4 | a2a4g2 | f6g2 | g2g2g4 | f2g6 | e2d2
[V:4] g2g2B2c4 | B2A4d2 | g6a2 | g2f2g4 | e2d6 | A2A2A2A4 | A2d4d2 | d4c2B2 | c2e2d4 | d2G6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/z3HPZZtrhWA?si=WCyyl-T5n6ainni7', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St Agnes, Durham (start high)
M:C
L:1/8
Q:1/4=76
K:G
b2b2b2a4 | b2c''4f2 | g6
% PHRASE_BREAK
d2 | d2d2b4 | a2a6
% PHRASE_BREAK
 |
c''2c''2b2a4 | g2f4e2 | d6
% PHRASE_BREAK
d2 | e2g2b4 | a2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (44, 'recGPpn5UCmNIiUIr', 'Tiverton', 'CM', 'X:1
T:Tiverton
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2c2d2 | BAG2A2
% PHRASE_BREAK
B2 | d2c2FBA2
% PHRASE_BREAK
 | G2F6 |
c2BAGFB2
% PHRASE_BREAK
 | cde2d2c2 | B2F2Ged2 | c2B6 | B2B2
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |d :r |m :d.t_1 |l_1 :t_1 |d :m |r :s_1.d |t_1 :l_1 |s_1 :— |— || :r |d.t_1:l_1.s_1 |d :r.m |f :m |r :d |s_1 :l_1.f |m :r |d :— |— || d |d ||","alto":":m_1 |s_1 :s_1 |s_1 :s_1 |f_1 :f_1 |m_1 :s_1 |s_1 :s_1.l_1 |s_1 :fe_1 |s_1 :— |— || :s_1 |s_1 :r_1 |s_1 :s_1 |s_1 :s_1 |s_1 :m_1.f_1 |s_1 :f_1.l_1 |s_1 :s_1.f_1 |m_1 :— |— || f_1 |m_1 ||","tenor":":d |d :t_1 |d :d |d :r |s_1 :d |r :m |r :r.d |t_1 :— |— || :t_1 |r :l_1.t_1 |d :t_1.d |r :d |t_1 :d |d :d |d :t_1 |d :— |— || l_1 |s_1 ||","bass":":d_1 |m_1 :s_1 |d :m_1 |f_1 :r_1 |d_1 :d_1 |t_2 :d_1 |r_1 :r_1 |s_1 :— |— || :s_1 |s_1 :f_1 |m_1 :r_1.d_1 |t_2 :d_1 |s_1 :l_1 |m_1 :f_1 |s_1 :s_1 |d_1 :— |— || f_1 |d_1 ||"}', 'X:1
T:Tiverton
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2B2c2d2 | BAG2A2B2 | d2c2FBA2 | G2F6 | c2BAGFB2 | cde2d2c2 | B2F2Ged2 | c2B6 | B2B2
[V:2] D2F2F2F2 | F2E2E2D2 | F2F2FGF2 | =E2F6 | F2F2C2F2 | F2F2F2F2 | DEF2EGF2 | FED6 | E2D2
[V:3] B2B2A2B2 | B2B2c2F2 | B2c2d2c2 | cBA6 | A2c2GAB2 | ABc2B2A2 | B2B2B2B2 | A2B6 | G2F2
[V:4] B,2D2F2B2 | D2E2C2B,2 | B,2A,2B,2C2 | C2F6 | F2F2E2D2 | CB,A,2B,2F2 | G2D2E2F2 | F2B,6 | E2B,2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=0qNOG6VpET8&ab_channel=WestminsterCovenanter', NULL, 'Start high!', false, false, NULL, NULL, NULL, false, 'X:1
T:Tiverton
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2c2d2 | BAG2A2
% PHRASE_BREAK
B2 | d2c2FBA2
% PHRASE_BREAK
 | G2F6 |
c2BAGFB2
% PHRASE_BREAK
 | cde2d2c2 | B2F2Ged2 | c2B6 | B2B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (46, 'recHrOBwYaCppZ93a', 'Humility', 'CM', 'X:1
T:Humility
M:C
L:1/8
Q:1/4=76
K:Eb
e2e2e2_g4 | e2e4_d2 | =B6
% PHRASE_BREAK
a2 | _g2e2e4 |
_d2_d6
% PHRASE_BREAK
 | _g2a2b2=b4 | _g2e2=e2_g2
% PHRASE_BREAK
 | a6_g2 | e2=e2_e4 | _d2=B6
', NULL, '{"doh":"Eb","time":"C","soprano":"m :m :m |s :- :m |m :- :r |d :- :- |l :s :m |m :- :r |r :- :- ||s :l :t |d'' :- :s |m :f :s |l :- :- |s :m :f |m :- :r |d :- :- ||","alto":"d :d :d |r :- :d |d :t_1 :t_1 |d :- :- |d :d :d |d :- :d |t_1 :- :- ||d :d :f |m :r :d |d :- :d |d :- :- |d :d :t_1 |t_1 :- :t_1 |d :- :- ||","tenor":"s :s :s |s :- :s |s :f :f |m :- :- |f :s :s |s :- :fe |s :- :- ||s :f :s |s :f :m |s :d'' :ta |l :d :r |m :s :l |s :- :f |m :- :- ||","bass":"d :d :d |t_1 :- :d |s_1 :- :s_1 |l_1 :- :- |f :m :d |l_1 :- :l_1 |s_1 :- :- ||m :f :r |d :r :m |d :l_1 :m_1 |f_1 :- :- |s_1 :s_1 :s_1 |s_1 :- :s_1 |d :- :- ||"}', 'X:1
T:Humility
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e2e2e2_g4 | e2e4_d2 | =B6a2 | _g2e2e4 | _d2_d6 | _g2a2b2=b4 | _g2e2=e2_g2 | a6_g2 | e2=e2_e4 | _d2=B6
[V:2] =B2=B2=B2_d4 | =B2=B2_B2=B2 | =B6=B2 | =B2=B2=B4 | =B2_B6 | =B2=B2=e2_e2 | _d2=B2=B4 | =B2=B6 | =B2=B2_B2=B4 | B2=B6
[V:3] _g2_g2_g2_g4 | _g2_g2=e2=e2 | e6=e2 | _g2_g2_g4 | f2_g6 | _g2=e2_g2_g2 | =e2_e2_g2=b2 | =a2_a2=B2_d2 | e2_g2a2_g4 | =e2_e6
[V:4] =B2=B2=B2_B4 | =B2_G4_G2 | A6=e2 | e2=B2A4 | A2_G6 | e2=e2_d2=B2 | _d2e2=B2A2 | E2=E6 | _G2_G2_G2_G4 | _G2=B6', NULL, NULL, NULL, 'https://youtu.be/yL958Mhkihg?si=ezRUpWSQllb7Ewfl', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Humility
M:C
L:1/8
Q:1/4=76
K:Eb
e2e2e2_g4 | e2e4_d2 | =B6
% PHRASE_BREAK
a2 | _g2e2e4 |
_d2_d6
% PHRASE_BREAK
 | _g2a2b2=b4 | _g2e2=e2_g2
% PHRASE_BREAK
 | a6_g2 | e2=e2_e4 | _d2=B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (55, 'recKTF1fTSL9PI6DB', 'Wetherby', 'CM', 'X:1
T:Wetherby
M:C
L:1/8
Q:1/4=76
K:Eb
e2_g4e_d | =B4_g2a4 | a2
% PHRASE_BREAK
_g4_g2 | =b4_b2=ba
% PHRASE_BREAK
 | _g2f2_g4 |
_g2b4_d''2 | =b4_g2
% PHRASE_BREAK
_g2 | =e2_e2=e4 | a2_g4=B2 | _d2e2_d2=B4 | =B2=B2
', NULL, '{"doh":"Eb","time":"C","soprano":":m |s :—:m.r |d :—:s |l :—:l |s :—:s |d'' :—:t |t.l:s :fe |s :—|| :s |t :—:r'' |d'' :—:s |s :f :m |f :—:l |s :—:d |r :m:r |d :—|| d |d ||","alto":":d |m :—:t_1 |d :—:d |d :—:d |d :—:r |d :—:r |m :r:r |t_1 :—|| :r |r :—:t_1 |d :—:m |m :r :de |r :—:f |m :—:d |d :—:t_1 |d :—|| l_1 |s_1 ||","tenor":":s |s :—:s.f |m :—:d |d :f :d.r |m :—:s |m :fe:s |d'' :t:l |s :—|| :t |t :—:s |s :—:t |l :—:l |l :—:r |m :—:s |l :s:s.f |m :—|| f |m ||","bass":":d |d :—:s_1 |l_1 :—:m_1 |f_1:l_1 :f_1 |d :—:t_1 |l_1 :—:t_1 |d :r:r |s_1 :—|| :s_1 |s_1 :—:f |m :—:m |l_1 :—:l_1 |r :—:t_1 |d :—:m_1 |f_1:s_1 :s_1 |d :—|| f_1 |d ||"}', 'X:1
T:Wetherby
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e2_g4e_d | =B4_g2a4 | a2_g4_g2 | =b4_b2=ba | _g2f2_g4 | _g2b4_d''2 | =b4_g2_g2 | =e2_e2=e4 | a2_g4=B2 | _d2e2_d2=B4 | =B2=B2
[V:2] =B2e4_B2 | =B4=B2=B4 | =B2=B4_d2 | =B4_d2e2 | _d2_d2B4 | _d2_d4B2 | =B4e2e2 | _d2c2_d4 | =e2_e4=B2 | =B4_B2=B4 | A2_G2
[V:3] _g2_g4_g=e | e4=B2=B2 | =e2=B_d_e4 | _g2e2f2_g2 | =b2_b2a2_g4 | b2b4_g2 | _g4b2a4 | a2a4_d2 | e4_g2a2 | _g2_g=e_e4 | =e2_e2
[V:4] =B2=B4_G2 | A4E2=E2 | A2=E2=B4 | B2A4B2 | =B2_d2_d2_G4 | _G2_G4=e2 | e4e2A4 | A2_d4B2 | =B4E2=E2 | _G2_G2=B4 | =E2=B2', NULL, NULL, NULL, 'https://youtu.be/h7ajDgFeqGo?si=vmy3D7UqrQ2GWR6w', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Wetherby
M:C
L:1/8
Q:1/4=76
K:Eb
e2_g4e_d | =B4_g2a4 | a2
% PHRASE_BREAK
_g4_g2 | =b4_b2=ba
% PHRASE_BREAK
 | _g2f2_g4 |
_g2b4_d''2 | =b4_g2
% PHRASE_BREAK
_g2 | =e2_e2=e4 | a2_g4=B2 | _d2e2_d2=B4 | =B2=B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (51, 'recJYfTw72Hy9NRUB', 'Kilmarnock', 'CM', 'X:1
T:Kilmarnock
M:C
L:1/8
Q:1/4=76
K:E
e2g2b2c''2 | bgg2f2
% PHRASE_BREAK
e2 | c''2b2e''c''b2
% PHRASE_BREAK
 | efg2f4 |
b2c''2b2e''2
% PHRASE_BREAK
 | gfe2f2g2 | c''2b2efg2 | f2e6 | e2e2
', NULL, '{"doh":"E","time":"C","soprano":":d |m :s |l :s.m|m :r |d :l |s :d''.l|s :d.r|m :r |—|| :s |l :s |d'':m.r|d :r |m :l |s :d.r|m :r |d :—|—||d |d||","alto":":s_1 |d :d |d :d |d :t_1|d :d |d :d |d :d |d :t_1|—|| :d |d :d.t_1|d :se_1|l_1 :t_1|d :d |d :d |d :t_1|d :—|—||l_1|s_1||","tenor":":m |s :s |f :s |s :s.f|m :f |s :m.f|m :fe|s :—|—|| :s |f :s.f|m :m |m :s |s :f |s :l |s :s.f|m :—|—||f |m||","bass":":d |d :m |f :m.d|s :s_1|d :f |m :d |d :l_1|s_1 :—|—|| :m |f :m.r|d :t_1|l_1 :s_1|d :f_1|m_1 :f_1|s_1 :s_1|d :—|—||f_1|d||"}', 'X:1
T:Kilmarnock
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] e2g2b2c''2 | bgg2f2e2 | c''2b2e''c''b2 | efg2f4 | b2c''2b2e''2 | gfe2f2g2 | c''2b2efg2 | f2e6 | e2e2
[V:2] B2e2e2e2 | e2e2d2e2 | e2e2e2e2 | e2e2d4 | e2e2ede2 | =c2^c2d2e2 | e2e2e2e2 | d2e6 | c2B2
[V:3] g2b2b2a2 | b2b2bag2 | a2b2gag2 | ^a2b6 | b2a2bag2 | g2g2b2b2 | a2b2c''2b2 | bag6 | a2g2
[V:4] e2e2g2a2 | geb2B2e2 | a2g2e2e2 | c2B6 | g2a2gfe2 | d2c2B2e2 | A2G2A2B2 | B2e6 | A2e2', NULL, NULL, NULL, 'https://youtu.be/LjNELnuTSsc?si=d19WVuTr8TAv2v4I', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Kilmarnock
M:C
L:1/8
Q:1/4=76
K:E
e2g2b2c''2 | bgg2f2
% PHRASE_BREAK
e2 | c''2b2e''c''b2
% PHRASE_BREAK
 | efg2f4 |
b2c''2b2e''2
% PHRASE_BREAK
 | gfe2f2g2 | c''2b2efg2 | f2e6 | e2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (57, 'recKwcLbxiAcHJlkC', 'Darwall', '66 66 88', 'X:1
T:Darwall
M:C
L:1/8
Q:1/4=76
K:D
d2f2d2a2 | f2d''6 | c''2b2a2g2 | f2e6 | e2f2d2b2 | a2^g2e2e''2 | d''2c''4b4 | a6a2 | b4c''4 | d''6d2 | e2f2g2a2 | b2c''2d''2e''2 | d''4c''4 | d''6', NULL, '{"doh":"D","time":"C","soprano":":d |m :d |s :m |d'' :— |— :t |l :s |f :m |r :— |— || :r |m :d |l :s |fe :r |r'' :d'' |t :— |l :— |s :— |— || :s |l :— |t :— |d'' :— |— :d |r :m |f || :s |l :t |d'' :r'' |d'' :— |t :— |d'' :— |— ||","alto":":d |d :d |r :d |m :— |— :m |f :d |t_1 :d |t_1 :— |— || :t_1 |d :d |m :m |r :r |r :m |r :— |— :d |t_1 :— |— || :d |d :— |r :— |m :— |— :d |t_1 :d |d || :d |d :m |m :r |m :— |r :f |m :— |— ||","tenor":":m |s :m |s :s |l :— |— :t |d'' :s |s :s |s :— |— || :s |s :m |d'' :t |l :fe |s :s |s :— |fe :— |s :— |— || :d'' |l :— |f :— |s :— |— :s |f :s |f || :m |l :se |l :l |s :— |s :— |s :— |— ||","bass":":d |d :d |t_1 :d |l :— |— :s |f :m |r :d |s_1 :— |— || :s_1 |d :d |l_1 :t_1.d |r :d |t_1 :d |r :— |r :— |s_1 :— |— || :m |f :— |r :— |d :— |— :m |r :d |l_1 || :d |f :m |l :f |s :— |s_1 :— |d :— |— ||"}', 'X:1
T:Darwall
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] d2f2d2a2 | f2d''6 | c''2b2a2g2 | f2e6 | e2f2d2b2 | a2^g2e2e''2 | d''2c''4b4 | a6a2 | b4c''4 | d''6d2 | e2f2g2a2 | b2c''2d''2e''2 | d''4c''4 | d''6
[V:2] d2d2d2e2 | d2f6 | f2g2d2c2 | d2c6 | c2d2d2f2 | f2e2e2e2 | f2e6 | d2c6 | d2d4e4 | f6d2 | c2d2d2d2 | d2f2f2e2 | f4e2g2 | f6
[V:3] f2a2f2a2 | a2b6 | c''2d''2a2a2 | a2a6 | a2a2f2d''2 | c''2b2^g2a2 | a2a4^g4 | a6d''2 | b4g4 | a6a2 | g2a2g2f2 | b2^a2b2b2 | a4a4 | a6
[V:4] d2d2d2c2 | d2b6 | a2g2f2e2 | d2A6 | A2d2d2B2 | cde2d2c2 | d2e4e4 | A6f2 | g4e4 | d6f2 | e2d2B2d2 | g2f2b2g2 | a4A4 | d6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Darwall
M:C
L:1/8
Q:1/4=76
K:D
d2f2d2a2 | f2d''6 | c''2b2a2g2 | f2e6 | e2f2d2b2 | a2^g2e2e''2 | d''2c''4b4 | a6a2 | b4c''4 | d''6d2 | e2f2g2a2 | b2c''2d''2e''2 | d''4c''4 | d''6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (72, 'recRBh9eQ8Jty2aZj', 'Jackson', 'CM', 'X:1
T:Jackson
M:C
L:1/8
Q:1/4=76
K:Eb
_g2_g2=b_ba2 | _g2=e2_g
% PHRASE_BREAK
=e_e2 | e2_g2=b2_b2
% PHRASE_BREAK
 | a2_g6 |
_g2e2e2=e2 | _g2a2
% PHRASE_BREAK
_d''=b_b2 | =b2_g2a=e_e2 | _d2=B6 | =B2=B2
', NULL, '{"doh":"Eb","time":"C","soprano":":s |s :d''.t |l :s |f :s.f |m :m |s :d'' |t :l |s :— |— || :s |m :m |f :s |l :r''.d'' |t :d'' |s :l.f |m :r |d :— |— || d |d ||","alto":":d |d :d |d :d |d :t_1 |d :d |r :m |r :-.d |t_1 :— |— || :t_1 |d :d |d :d |d :f.m |r :m |d :d |d :t_1 |d :— |— || l_1 |s_1 ||","tenor":":m |m :s |f :s |l :s |s :s |s :s |s :fe |s :— |— || :s |s :s |l :s |f :l |t :s |d'' :l |s :s.f |m :— |— || f |m ||","bass":":d |d :m |f :m |r :s_1 |d :d |t_1 :d |r :r |s_1 :— |— || :s_1 |d :ta_1 |l_1 :m |f :r |s :d |m :f |s :s_1 |d :— |— || f_1 |d ||"}', 'X:1
T:Jackson
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2_g2=b_ba2 | _g2=e2_g=e_e2 | e2_g2=b2_b2 | a2_g6 | _g2e2e2=e2 | _g2a2_d''=b_b2 | =b2_g2a=e_e2 | _d2=B6 | =B2=B2
[V:2] =B2=B2=B2=B2 | =B2=B2_B2=B2 | =B2_d2e2_d3 | =B_B6=B2 | =B2=B2=B2=B2 | =B2=e_e_d2=e2 | =B2=B2=B2_B2 | =B6A2 | _G2
[V:3] e2e2_g2=e2 | _g2a2_g2_g2 | _g2_g2_g2_g2 | f2_g6 | _g2_g2_g2a2 | _g2=e2a2b2 | _g2=b2a2_g2 | _g=e_e6 | =e2_e2
[V:4] =B2=B2e2=e2 | e2_d2_G2=B2 | =B2_B2=B2_d2 | _d2_G6 | _G2=B2=A2_A2 | e2=e2_d2_g2 | =B2e2=e2_g2 | _G2=B6 | =E2=B2', NULL, NULL, NULL, 'https://youtu.be/SVDZl443J7Y?si=kB7lOHrxJTdHK88D', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Jackson
M:C
L:1/8
Q:1/4=76
K:Eb
_g2_g2=b_ba2 | _g2=e2_g
% PHRASE_BREAK
=e_e2 | e2_g2=b2_b2
% PHRASE_BREAK
 | a2_g6 |
_g2e2e2=e2 | _g2a2
% PHRASE_BREAK
_d''=b_b2 | =b2_g2a=e_e2 | _d2=B6 | =B2=B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (35, 'recClz26OP1R9yQSL', 'Culross', 'CM', 'X:1
T:Culross
M:C
L:1/8
Q:1/4=76
K:Am
e2a2c''2b2 | a2^g2a2b2
% PHRASE_BREAK
 | e2a2^g2a2 |
b2c''6
% PHRASE_BREAK
 | g2c''2e''2d''2 | c''2b2a2^g2
% PHRASE_BREAK
 | e2a2c''2b2 | b2a6
', NULL, '{"doh":"C","time":"C","soprano":":m |l :d'' |t :l |se :l |t :m |l :se |l :t |d'' :— |—|| :s |d'' :m'' |r'' :d'' |t :l |se :m |l :d'' |t :t |l :— |—|| l | l","alto":":d |m :m |f :r |m :m |m :m |m :m |m :s |s :— |—|| :m |s :s |s :m |f :r |m :m |m :m |f :m.r |d :— |—|| r | de","tenor":":l |l :l |f :l |t :d''.l |se :se |l :t |d'' :r'' |m'' :— |—|| :d'' |d'' :d'' |t :l |r'' :l |t :se |l :l |l :se |l :— |—|| f | m","bass":":l_1 |d :l_1 |r :f |m :l_1 |m :m.r |d :m |l :s |d :— |—|| :d |m :d |s :l |r :f |m :m.r |d :l_1 |r :m |l_1 :— |—|| r | l_1","lah":"A","mode":"minor"}', 'X:1
T:Culross
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Am
[V:1] e2a2c''2b2 | a2^g2a2b2 | e2a2^g2a2 | b2c''6 | g2c''2e''2d''2 | c''2b2a2^g2 | e2a2c''2b2 | b2a6
[V:2] c2e2e2f2 | d2e2e2e2 | e2e2e2e2 | g2g6 | e2g2g2g2 | e2f2d2e2 | e2e2e2f2 | edc6
[V:3] a2a2a2f2 | a2b2c''a^g2 | ^g2a2b2c''2 | d''2e''6 | c''2c''2c''2b2 | a2d''2a2b2 | ^g2a2a2a2 | ^g2a6
[V:4] A2c2A2d2 | f2e2A2e2 | edc2e2a2 | g2c6 | c2e2c2g2 | a2d2f2e2 | edc2A2d2 | e2A6', NULL, NULL, NULL, 'https://hymnary.org/media/fetch/183014', NULL, ' ', false, false, NULL, NULL, NULL, false, 'X:1
T:Culross
M:C
L:1/8
Q:1/4=76
K:Am
e2a2c''2b2 | a2^g2a2b2
% PHRASE_BREAK
 | e2a2^g2a2 |
b2c''6
% PHRASE_BREAK
 | g2c''2e''2d''2 | c''2b2a2^g2
% PHRASE_BREAK
 | e2a2c''2b2 | b2a6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (91, 'recXfpSqL0gpoqTwo', 'Leuchars', 'CM', 'X:1
T:Leuchars
M:C
L:1/8
Q:1/4=76
K:F
a4a2c''2 | b2a2g4 | a4f2
% PHRASE_BREAK
f2 | g2g2a4 |
a4b2
% PHRASE_BREAK
a2 | g2f2e4 | f4g2a2 | g2
% PHRASE_BREAK
g2f4 | f2f2
', NULL, '{"doh":"F","time":"C","soprano":"m :— | m :s | f :m | r :— | m :— | d :d | r :r | m :—|| m :— | f :m | r :d | t_1 :— | d :— | r :m | r :r | d :—|| d | d||","alto":"d :— | d :t_1 | r :d | t_1 :— | t_1 :— | l_1 :l_1 | t_1 :t_1 | d :—|| d :— | l_1 :d | t_1 :l_1 | se_1 :— | l_1 :— | t_1 :d | d :t_1 | d :—|| l_1 | s_1||","tenor":"s :— | s :s | s :s | s :— | se :— | l :m | s :s | s :—|| s :— | f :s | s :m | m :— | m :— | s :s | l :s | m :—|| f | m||","bass":"d :— | d :s_1 | t_1 :d | s_1 :— | m_1 :— | l_1 :l_1 | s_1 :s_1 | d :—|| d :— | r :d | s_1 :l_1 | m_1 :— | l_1 :— | s_1 :m_1 | f_1 :s_1 | d :—|| f_1 | d||"}', 'X:1
T:Leuchars
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] a4a2c''2 | b2a2g4 | a4f2f2 | g2g2a4 | a4b2a2 | g2f2e4 | f4g2a2 | g2g2f4 | f2f2
[V:2] f4f2e2 | g2f2e4 | e4d2d2 | e2e2f4 | f4d2f2 | e2d2_d4 | d4e2f2 | f2e2f4 | d2c2
[V:3] c''4c''2c''2 | c''2c''2c''4 | _d''4=d''2a2 | c''2c''2c''4 | c''4b2c''2 | c''2a2a4 | a4c''2c''2 | d''2c''2a4 | b2a2
[V:4] f4f2c2 | e2f2c4 | A4d2d2 | c2c2f4 | f4g2f2 | c2d2A4 | d4c2A2 | B2c2f4 | B2f2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Leuchars
M:C
L:1/8
Q:1/4=76
K:F
a4a2c''2 | b2a2g4 | a4f2
% PHRASE_BREAK
f2 | g2g2a4 |
a4b2
% PHRASE_BREAK
a2 | g2f2e4 | f4g2a2 | g2
% PHRASE_BREAK
g2f4 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (67, 'recPhDZMa0cqeXRde', 'Kredron (EPC chant?)', 'CM', 'X:1
T:Kredron (EPC chant?)
M:C
L:1/8
Q:1/4=76
K:G
b2bbbbb2 | a2b4
% PHRASE_BREAK
b2 | d''ba4a2 |
a4
% PHRASE_BREAK
bbba | g2c''2c''2b2
% PHRASE_BREAK
 | e''2e''e''d''2b2 | a2g4
', NULL, '{"doh":"G","time":"C","soprano":":m | m.m:m.m | m :r | m :— || .m:s.m | r :— :r | r :— || m.m:m.r | d :f | f :m || .l:l.l | s :m :r | d :— ||","alto":":d | d.d:d.d | d :t_1 | d :— || .d:m.d | d :l_1 :d | t_1 :— || s_1.s_1:se_1.se_1 | l_1 :l_1 | t_1 :d || .d:d.d | d :l_1 :t_1 | s_1 :— ||","tenor":":s | s.s:s.s | s :s | s :— || .s:s.s | fe :— :fe | s :— || d.d:t_1.t_1 | d :r | r :d || .f:f.f | m :s :f | m :— ||","bass":":d | d.d:d.d | d :s_1 | d :— || .d:d.d | r :— :r_1 | s_1 :— || d.d:m_1.m_1 | f_1 :r_1 | s_1 :d || .f_1:f_1.f_1 | s_1 :— :s_1 | d_1 :— ||"}', 'X:1
T:Kredron (EPC chant?)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] b2bbbbb2 | a2b4b2 | d''ba4a2 | a4bbba | g2c''2c''2b2 | e''2e''e''d''2b2 | a2g4
[V:2] g2ggggg2 | f2g4g2 | bgg2e2g2 | f4dd^d^d | e2e2f2g2 | g2ggg2e2 | f2d4
[V:3] d''2d''d''d''d''d''2 | d''2d''4d''2 | d''d''^c''4^c''2 | d''4ggff | g2a2a2g2 | c''2c''c''b2d''2 | c''2b4
[V:4] g2ggggg2 | d2g4g2 | gga4A2 | d4ggBB | c2A2d2g2 | c2ccd4 | d2G4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Kredron (EPC chant?)
M:C
L:1/8
Q:1/4=76
K:G
b2bbbbb2 | a2b4
% PHRASE_BREAK
b2 | d''ba4a2 |
a4
% PHRASE_BREAK
bbba | g2c''2c''2b2
% PHRASE_BREAK
 | e''2e''e''d''2b2 | a2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (33, 'recBeiM4VNZdfDtl1', 'Ravensburg', 'CM', 'X:1
T:Ravensburg
M:C
L:1/8
Q:1/4=76
K:D
d''2a2b2ag | f2e2e2
% PHRASE_BREAK
f2 | a2b2c''2d''2 |
b2
% PHRASE_BREAK
a6 | fga2a2d''2 | c''2b2
% PHRASE_BREAK
^a2b2 | d''2a2f2b2 | c''2d''6
', NULL, '{"doh":"D","time":"C","soprano":":d'' |s :l |s.f:m |r :r |m :s |l :t |d'' :l |s :- |- || :m.f |s :s |d'' :t |l :se |l :d'' |s :m |l :t |d'' :- |- || d'' |d''","alto":":m |s :f |r :d |d :t_1 |d :m |r :r |d :r.d |t_1 :- |- || :d |r :m |m :f |m :m.r |d :d |r :m |f :r |m :- |- || f |m","tenor":":s |d'' :d'' |t :d'' |l :s |s :s |fe :s |m :fe |s :- |- || :s |s :d'' |d'' :r'' |d'' :t |l :m |s :d'' |d'' :s |s :- |- || l |s","bass":":d |m :f |s :l |f :s |d :d |d :t_1 |l_1 :r |s_1 :- |- || :d |t_1 :d |l_1 :r |m :m |l_1 :l_1 |t_1 :d |f :s |d :- |- || f |d"}', 'X:1
T:Ravensburg
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] d''2a2b2ag | f2e2e2f2 | a2b2c''2d''2 | b2a6 | fga2a2d''2 | c''2b2^a2b2 | d''2a2f2b2 | c''2d''6
[V:2] f2a2g2e2 | d2d2c2d2 | f2e2e2d2 | edc6 | d2e2f2f2 | g2f2fed2 | d2e2f2g2 | e2f6
[V:3] a2d''2d''2c''2 | d''2b2a2a2 | a2^g2a2f2 | ^g2a6 | a2a2d''2d''2 | e''2d''2c''2b2 | f2a2d''2d''2 | a2a6
[V:4] d2f2g2a2 | b2g2a2d2 | d2d2c2B2 | e2A6 | d2c2d2B2 | e2f2f2B2 | B2c2d2g2 | a2d6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Ravensburg
M:C
L:1/8
Q:1/4=76
K:D
d''2a2b2ag | f2e2e2
% PHRASE_BREAK
f2 | a2b2c''2d''2 |
b2
% PHRASE_BREAK
a6 | fga2a2d''2 | c''2b2
% PHRASE_BREAK
^a2b2 | d''2a2f2b2 | c''2d''6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (65, 'recOFQDSsTCP5yJtL', 'Trentham', 'SM', 'X:1
T:Trentham
C:Robert Jackson 1888
M:3/4
L:1/4
Q:1/4=88
K:G
G2 A | B c d | G2
% PHRASE_BREAK
 :|
| B | c2 d | e d c
% PHRASE_BREAK
 | B2 :|
| d2 d | c B A | G F
% PHRASE_BREAK
 E | D3 :|
| G2 A | B c d | G3 :|
', NULL, '{"doh":"F","time":"C","soprano":"m :m :m | f :- :d | m :- :- | s :f :m | r :- :m | r :- :-|| m :f :l | s :- :m | m :- :r | f :- :r | d :t_1 :d | m :- :r | d :- :-||","alto":"d :d :d | d :- :d | d :- :- | d :d :d | d :- :d | t_1 :- :-|| d :d :t_1 | d :- :d.t_1 | l_1 :- :l_1 | l_1 :- :l_1 | s_1 :- :s_1 | d :- :t_1 | s_1 :- :-||","tenor":"s :d'' :t | l :- :se | s :- :- | s :s :s | l :- :l | s :- :-|| s :l :f | m :- :s | s :- :f | f :- :f | m :r :m | s :- :f | m :- :-||","bass":"d :d :d | d :- :d | d :- :- | m :r :d | f_1 :- :fe_1 | s_1 :- :-|| d :d :r | m :- :d | f_1 :- :f_1 | r_1 :- :f_1 | s_1 :- :s_1 | s_1 :- :s_1 | d :- :-||"}', 'X:1
T:Trentham
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] a2a2a2b4 | f2a6 | c''2b2a2g4 | a2g6 | a2b2d''2c''4 | a2a4g2 | b4g2f2 | e2f2a4 | g2f6
[V:2] f2f2f2f4 | f2f6 | f2f2f2f4 | f2e6 | f2f2e2f4 | fed4d2 | d4d2c4 | c2f4e2 | c6
[V:3] c''2f''2e''2d''4 | _d''2c''6 | c''2c''2c''2d''4 | d''2c''6 | c''2d''2b2a4 | c''2c''4b2 | b4b2a2 | g2a2c''4 | b2a6
[V:4] f2f2f2f4 | f2f6 | a2g2f2B4 | =B2c6 | f2f2g2a4 | f2B4B2 | G4B2c4 | c2c4c2 | f6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Trentham
C:Robert Jackson 1888
M:3/4
L:1/4
Q:1/4=88
K:G
G2 A | B c d | G2
% PHRASE_BREAK
 :|
| B | c2 d | e d c
% PHRASE_BREAK
 | B2 :|
| d2 d | c B A | G F
% PHRASE_BREAK
 E | D3 :|
| G2 A | B c d | G3 :|
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (42, 'recFqEfAqVi5OBTQa', 'St. Bernard', 'CM', 'X:1
T:St. Bernard
M:C
L:1/8
Q:1/4=76
K:Eb
_g2=B2_d2e2 | _d=B=e2_e2
% PHRASE_BREAK
_d2 | _g2e2a2f3 | f
% PHRASE_BREAK
_g6_g2 |
=b2a2_g2a2 | =e2=e2
% PHRASE_BREAK
_e2=B2 | =e2_e2_d2_d2 | =B6=B2 | =B2
', NULL, '{"doh":"Eb","time":"C","soprano":":s |d :r |m :r.d |f :m |r :s |m :l |fe :-.fe |s :— |—|| :s |d'' :l |s :l |f :f |m :d |f :m |r :r |d :— |—|| d | d ||","alto":":d |d :t_1 |d :t_1.d |t_1 :d |t_1 :r |d :d |d :-.d |t_1 :— |—|| :t_1 |d :d |d :l_1 |l_1 :r |d :d |t_1 :d |d :t_1 |d :— |—|| l_1 | s_1 ||","tenor":":m |s :s |s :s |f :s |s :s |s :l |l :-.l |s :— |—|| :s |s :f |m :m |f :s |s :s |f :s |l :s.f |m :— |—|| f | m ||","bass":":d |m :r |d :f.m |r :d |s_1 :t_1 |d :l_1 |r :-.r |s_1 :— |—|| :s |m :f |d :de |r :t_1 |d :m |r :d |f_1 :s_1 |d :— |—|| f_1 | d ||"}', 'X:1
T:St. Bernard
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2=B2_d2e2 | _d=B=e2_e2_d2 | _g2e2a2f3 | f_g6_g2 | =b2a2_g2a2 | =e2=e2_e2=B2 | =e2_e2_d2_d2 | =B6=B2 | =B2
[V:2] =B2=B2_B2=B2 | B=B_B2=B2_B2 | _d2=B2=B2=B3 | =B_B6=B2 | =B2=B2=B2A2 | A2_d2=B2=B2 | B2=B2=B2_B2 | =B6A2 | _G2
[V:3] e2_g2_g2_g2 | _g2=e2_g2_g2 | _g2_g2a2a3 | a_g6_g2 | _g2=e2_e2=e2 | =e2_g2_g2_g2 | =e2_g2a2_g=e | e6=e2 | e2
[V:4] =B2e2_d2=B2 | =e_e_d2=B2_G2 | B2=B2A2_d3 | _d_G6_g2 | e2=e2=B2c2 | _d2B2=B2e2 | _d2=B2=E2_G2 | =B6=E2 | =B2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=uZtVqBF50Vk&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Bernard
M:C
L:1/8
Q:1/4=76
K:Eb
_g2=B2_d2e2 | _d=B=e2_e2
% PHRASE_BREAK
_d2 | _g2e2a2f3 | f
% PHRASE_BREAK
_g6_g2 |
=b2a2_g2a2 | =e2=e2
% PHRASE_BREAK
_e2=B2 | =e2_e2_d2_d2 | =B6=B2 | =B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (1, 'rec0IMCnmbAbCDTjD', 'Lancaster', 'CM', 'X:1
T:Lancaster
M:C
L:1/8
Q:1/4=76
K:A
e2a2b2c''2 | a2d''2c''2b2
% PHRASE_BREAK
 | b2c''2a2g2 |
f2e6
% PHRASE_BREAK
 | e2f2g2a2 | g2a2b2c''2
% PHRASE_BREAK
 | c''2e''2d''2c''2 | b2a6
', NULL, '{"doh":"A","time":"C","soprano":":s_1 |d :r |m :d |f :m |r :r |m :d |t_1 :l_1 |s_1 :— |— || :s_1 |l_1 :t_1 |d :t_1 |d :r |m :m |s :f |m :r |d :— |— ||","alto":":m_1 |s_1 :s_1 |s_1 :l_1 |l_1 :s_1 |s_1 :s_1 |s_1 :s_1 |s_1 :fe_1 |s_1 :— |— || :s_1 |f_1 :f_1 |s_1 :f_1 |m_1 :l_1 |se_1 :l_1 |s_1 :l_1 |s_1 :f_1 |m_1 :— |— ||","tenor":":d |d :t_1 |d :d |d :d |t_1 :t_1 |d :d |r :d |t_1 :— |— || :d |d :r |m :r |d :l_1 |t_1 :d |d :d |d :t_1 |d :— |— ||","bass":":d_1 |m_1 :s_1 |d :l_1 |f_1 :d_1 |s_1 :s_1 |d_1 :m_1 |r_1 :r_1 |s_1 :— |— || :m_1 |f_1 :r_1 |d_1 :s_1 |l_1 :f_1 |m_1 :l_1 |m_1 :f_1 |s_1 :s_1 |d_1 :— |— ||"}', 'X:1
T:Lancaster
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a2b2c''2 | a2d''2c''2b2 | b2c''2a2g2 | f2e6 | e2f2g2a2 | g2a2b2c''2 | c''2e''2d''2c''2 | b2a6
[V:2] c2e2e2e2 | f2f2e2e2 | e2e2e2e2 | ^d2e6 | e2d2d2e2 | d2c2f2=f2 | f2e2f2e2 | d2c6
[V:3] a2a2g2a2 | a2a2a2g2 | g2a2a2b2 | a2g6 | a2a2b2c''2 | b2a2f2g2 | a2a2a2a2 | g2a6
[V:4] A2c2e2a2 | f2d2A2e2 | e2A2c2B2 | B2e6 | c2d2B2A2 | e2f2d2c2 | f2c2d2e2 | e2A6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=nsVUJ-1jI3Y&ab_channel=WestminsterCovenanter', 'poor quality', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Lancaster
M:C
L:1/8
Q:1/4=76
K:A
e2a2b2c''2 | a2d''2c''2b2
% PHRASE_BREAK
 | b2c''2a2g2 |
f2e6
% PHRASE_BREAK
 | e2f2g2a2 | g2a2b2c''2
% PHRASE_BREAK
 | c''2e''2d''2c''2 | b2a6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (54, 'recKDe8SIZVjO0cC7', 'St. Leonard', 'CM', 'X:1
T:St. Leonard
M:C
L:1/8
Q:1/4=76
K:C
g2g2e2a2 | g2a2b2c''2
% PHRASE_BREAK
 | d''2e''2c''2b2 | a2g6
% PHRASE_BREAK
 |
d''2b2g2c''2 | d''2e''2c''2a2
% PHRASE_BREAK
 | d''2g2c''2c''2 | b2c''6 | c''2c''2
', NULL, '{"doh":"C","time":"C","soprano":":s |s :m |l :s |l :t |d'' :r'' |m'' :d'' |t :l |s :— |—|| :r'' |t :s |d'' :r'' |m'' :d'' |l :r'' |s :d'' |d'' :t |d'' :— |—|| d'' |d''||","alto":":m |m :d |d :d |f :f |m :s |s :l |s :fe |s :— |—|| :s |s :r |s :s |s :s |d :f |m :m |r :r |m :— |—|| f |m||","tenor":":d'' |d'' :s |f :s |f :f |s :t |d'' :m'' |r'' :d'' |t :— |—|| :t |r'' :t |d'' :t |d'' :s |l :l.t |d'' :d'' |l :s |s :— |—|| l |s||","bass":":d |d :d |f :m |r :r |d :s |d :d |r :r |s :— |—|| :s |s :s.f |m :r |d :m |f :r |m :l |f :s |d :— |—|| f |d||"}', 'X:1
T:St. Leonard
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2g2e2a2 | g2a2b2c''2 | d''2e''2c''2b2 | a2g6 | d''2b2g2c''2 | d''2e''2c''2a2 | d''2g2c''2c''2 | b2c''6 | c''2c''2
[V:2] e2e2c2c2 | c2f2f2e2 | g2g2a2g2 | ^f2g6 | g2g2d2g2 | g2g2g2c2 | f2e2e2d2 | d2e6 | f2e2
[V:3] c''2c''2g2f2 | g2f2f2g2 | b2c''2e''2d''2 | c''2b6 | b2d''2b2c''2 | b2c''2g2a2 | abc''2c''2a2 | g2g6 | a2g2
[V:4] c2c2c2f2 | e2d2d2c2 | g2c2c2d2 | d2g6 | g2g2gfe2 | d2c2e2f2 | d2e2a2f2 | g2c6 | f2c2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=qT-FWUAt990&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Leonard
M:C
L:1/8
Q:1/4=76
K:C
g2g2e2a2 | g2a2b2c''2
% PHRASE_BREAK
 | d''2e''2c''2b2 | a2g6
% PHRASE_BREAK
 |
d''2b2g2c''2 | d''2e''2c''2a2
% PHRASE_BREAK
 | d''2g2c''2c''2 | b2c''6 | c''2c''2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (11, 'rec3Z1M3OmbyGCgsm', 'Main', 'CM', 'X:1
T:Main
M:C
L:1/8
Q:1/4=76
K:D
a2a4f2 | d''4c''2b4 | g2g4
% PHRASE_BREAK
b2 | a4f2f2 |
e2d2
% PHRASE_BREAK
e10 | a2a4f2 | d''4c''2b4 | g2
% PHRASE_BREAK
g4b2 | a4d''2c''2 | b2c''2d''10
', NULL, '{"doh":"D","time":"C","soprano":":s | s :—:m | d'' :—:t | l :—:f | f :—:l | s :—:m | m:r :d | r :—:— | —:—|| :s | s :—:m | d'' :—:t | l :—:f | f :—:l | s :—:d'' | t:l :t | d'' :—:— | —:—||","alto":":m | m :—:d | m :—:s | f :—:d | d :—:f | m :—:d | d :—:d | t_1 :—:— | —:—|| :t_1 | d :—:d | m :—:s | f :—:d | d :—:f | m :—:m | f :—:f | m :—:— | —:—||","tenor":":s | s :—:s | s:d'':d'' | d'' :—:l | l :—:d'' | d'' :—:s | l :—:m | s :—:— | —:—|| :f | m :—:s | s:d'':d'' | d'' :—:l | l :—:d'' | d'' :—:s | s :—:s | s :—:— | —:—||","bass":":d | d :—:d | d :—:m | f :—:f | f :—:f | d :—:d | l_1 :—:l_1 | s_1 :—:— | —:—|| :s_1 | d :—:d | d :—:m | f :—:f | f :—:f | s :—:s | s_1 :—:s_1 | d :—:— | —:—||"}', 'X:1
T:Main
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2a4f2 | d''4c''2b4 | g2g4b2 | a4f2f2 | e2d2e10 | a2a4f2 | d''4c''2b4 | g2g4b2 | a4d''2c''2 | b2c''2d''10
[V:2] f2f4d2 | f4a2g4 | d2d4g2 | f4d2d4 | d2c10 | c2d4d2 | f4a2g4 | d2d4g2 | f4f2g4 | g2f10
[V:3] a2a4a2 | a2d''2d''2d''4 | b2b4d''2 | d''4a2b4 | f2a10 | g2f4a2 | a2d''2d''2d''4 | b2b4d''2 | d''4a2a4 | a2a10
[V:4] d2d4d2 | d4f2g4 | g2g4g2 | d4d2B4 | B2A10 | A2d4d2 | d4f2g4 | g2g4g2 | a4a2A4 | A2d10', NULL, NULL, NULL, 'https://youtu.be/6OZSlJWhKTo?si=cL1pBlXbA-QGYBOG', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Main
M:C
L:1/8
Q:1/4=76
K:D
a2a4f2 | d''4c''2b4 | g2g4
% PHRASE_BREAK
b2 | a4f2f2 |
e2d2
% PHRASE_BREAK
e10 | a2a4f2 | d''4c''2b4 | g2
% PHRASE_BREAK
g4b2 | a4d''2c''2 | b2c''2d''10
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (62, 'recNStuxfA1VB7GB7', 'St. John', '66 66 88', 'X:1
T:St. John
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2e2_g2 | _g2=b6 | =b2_b2a2_g2 | f2_g6 | _g2a2b2=b2 | a2_g6 | _g2=e2_e2_d2 | _d2=B6 | =B2=B2_d2e2 | =B2e2=e2_g2 | _g2a2b2=b2 | =b2_d''4_b4 | =b6z2', NULL, '{"doh":"Eb","time":"C","soprano":":d |m :m |s :s |d'' :— |— :d'' |t :l |s :fe |s :— |— |:s |l :t |d'' :l |s :— |— :s |f :m |r :r |d :— |— |:d |d :r |m :d |m :f |s |:s |l :t |d'' :d'' |r'' :— |t :— |d'' :— |— || d'' d'' ||","alto":":d |d :d |r :r |m :— |— :m |m :m |r :r |r :— |— |:m |f :f |s :f |m :— |— :d |d :d |d :t_1 |d :— |— |:d |d :t_1 |d :d |d :d |r |:m |f :f |s :m |f :— |r :— |m :— |— || f m ||","tenor":":m |s :s |s :r'' |d'' :— |— :d'' |r'' :d'' |t :l |t :— |— |:d'' |d'' :r'' |d'' :d'' |d'' :— |— :s |l :s |s :f |m :— |— |:m |m :s |s :s |s :l |t |:d'' |d'' :r'' |d'' :d'' |l :— |s :— |s :— |— || l s ||","bass":":d |d :d |t_1 :t_1 |l_1 :— |— :l_1 |t_1 :d |r :r |s_1 :— |— |:d |f :r |m :f |d :— |— :m |l_1 :d |s_1 :s_1 |d :— |— |:d |l_1 :s_1 |d :m |d :l_1 |s_1 |:d |f :r |m :l |f :— |s :— |d :— |— || f d ||"}', 'X:1
T:St. John
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e2e2_g2 | _g2=b6 | =b2_b2a2_g2 | f2_g6 | _g2a2b2=b2 | a2_g6 | _g2=e2_e2_d2 | _d2=B6 | =B2=B2_d2e2 | =B2e2=e2_g2 | _g2a2b2=b2 | =b2_d''4_b4 | =b6z2
[V:2] =B2=B2=B2_d2 | _d2e6 | e2e2e2_d2 | _d2_d6 | e2=e2=e2_g2 | =e2_e6 | =B2=B2=B2=B2 | B2=B6 | =B2=B2_B2=B2 | =B2=B2=B2_d2 | e2=e2=e2_g2 | e2=e4_d4 | e6z2
[V:3] e2_g2_g2_g2 | _d''2=b6 | =b2_d''2=b2_b2 | a2b6 | =b2=b2_d''2=b2 | =b2=b6 | _g2a2_g2_g2 | =e2_e6 | e2e2_g2_g2 | _g2_g2a2b2 | =b2=b2_d''2=b2 | =b2a4_g4 | _g6z2
[V:4] =B2=B2=B2_B2 | B2A6 | A2B2=B2_d2 | _d2_G6 | =B2=e2_d2_e2 | =e2=B6 | e2A2=B2_G2 | _G2=B6 | =B2A2_G2=B2 | e2=B2A2_G2 | =B2=e2_d2_e2 | a2=e4_g4 | =B6z2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:St. John
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2e2_g2 | _g2=b6 | =b2_b2a2_g2 | f2_g6 | _g2a2b2=b2 | a2_g6 | _g2=e2_e2_d2 | _d2=B6 | =B2=B2_d2e2 | =B2e2=e2_g2 | _g2a2b2=b2 | =b2_d''4_b4 | =b6z2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (71, 'recRAB0UgsH7UxNfZ', 'Wallace', 'CM', 'X:1
T:Wallace
M:C
L:1/8
Q:1/4=76
K:G
b4c''2g4 | a2d''4c''2 |
g4g2
% PHRASE_BREAK
c''6 | g6e''6 | c10
', NULL, '{"doh":"G","time":"C","soprano":"|m :— :f |d :— :r |s :— :f |d :— :d ||f :— :— |d :— :— |l :— :— |f_1 :— :— |— :— ||","alto":"|s :— :l |m :— :d |m :— :f |d :— :f_1 ||m :— :r |d :— :l_1 |s :— :f |s_1 :— :s_1 |— :— ||","tenor":"|s :— :m |d :— :d |m :— :s |s_1 :— :s_1 ||d :— :t_1 |s_1 :— :f |m :— :f |s_1 :— :s_1 |— :— ||","bass":"|r :— :s |t_1 :— :s_1 |s :— :s |s_1 :— :s_1 ||— :— |— :— |— :— |— :— |— :— ||"}', 'X:1
T:Wallace
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] b4c''2g4 | a2d''4c''2 | g4g2c''6 | g6e''6 | c10
[V:2] d''4e''2b4 | g2b4c''2 | g4c2b4 | a2g4e2 | d''4c''2d4 | d6
[V:3] d''4b2g4 | g2b4d''2 | d4d2g4 | f2d4c''2 | b4c''2d4 | d6
[V:4] a4d''2f4 | d2d''4d''2 | d4d22', NULL, NULL, NULL, 'https://soundcloud.com/connorq/psalm-4-v8-tune-wallace-smv', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Wallace
M:C
L:1/8
Q:1/4=76
K:G
b4c''2g4 | a2d''4c''2 |
g4g2
% PHRASE_BREAK
c''6 | g6e''6 | c10
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (77, 'recTVTo0gNWB9CiWL', 'Old 29th', 'CM', 'X:1
T:Old 29th
M:C
L:1/8
Q:1/4=76
K:D
d''2d''2c''2d''2 | a2b2b2a2
% PHRASE_BREAK
 | b2e''2d''2c''2 |
b2a6
% PHRASE_BREAK
 | a2f2e2d2 | f2g2a2b2
% PHRASE_BREAK
 | c''2d''2e''2d''2 | c''2d''6
', NULL, '{"doh":"D","time":"C","soprano":":d'' |d'' :t |d'' :s |l :l |s :l |r'' :d'' |t :l |s :— |—|| :s |m :r |d :m |f :s |l :t |d'' :r'' |d'' :t |d'' :— |—||","alto":":m |m :r |d :d |d :d |d :d |f :m |r :d |t_1 :— |—|| :r |d :t_1 |d :d |d :d |d :r |d :f |m :r |m :— |—||","tenor":":s |s :s |m :s |f :f |m :l |s :s |s :fe |s :— |—|| :s |s :f |m :s |f :m |f :f |s :l |s :s |s :— |—||","bass":":d |d :s_1 |l_1 :m |f :f_1 |d :f |t_1 :d |r :r |s_1 :— |—|| :t_1 |d :s_1 |l_1 :ta_1 |l_1 :d |f :r |m :f |s :s_1 |d :— |—||"}', 'X:1
T:Old 29th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] d''2d''2c''2d''2 | a2b2b2a2 | b2e''2d''2c''2 | b2a6 | a2f2e2d2 | f2g2a2b2 | c''2d''2e''2d''2 | c''2d''6
[V:2] f2f2e2d2 | d2d2d2d2 | d2g2f2e2 | d2c6 | e2d2c2d2 | d2d2d2d2 | e2d2g2f2 | e2f6
[V:3] a2a2a2f2 | a2g2g2f2 | b2a2a2a2 | ^g2a6 | a2a2g2f2 | a2g2f2g2 | g2a2b2a2 | a2a6
[V:4] d2d2A2B2 | f2g2G2d2 | g2c2d2e2 | e2A6 | c2d2A2B2 | =c2B2d2g2 | e2f2g2a2 | A2d6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Old 29th
M:C
L:1/8
Q:1/4=76
K:D
d''2d''2c''2d''2 | a2b2b2a2
% PHRASE_BREAK
 | b2e''2d''2c''2 |
b2a6
% PHRASE_BREAK
 | a2f2e2d2 | f2g2a2b2
% PHRASE_BREAK
 | c''2d''2e''2d''2 | c''2d''6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (74, 'recSv179X4RC67euE', 'Corona', 'CM', 'X:1
T:Corona
M:C
L:1/8
Q:1/4=76
K:Am
e2c''2a2^g2 | b2a2f2e2
% PHRASE_BREAK
 | e2e2c''2b2 | e2a6
% PHRASE_BREAK
 |
a2d''3c''b2 | a2a2g2g2
% PHRASE_BREAK
 | c''2c''3c''e''2 | d''2c''6 | c''2c''2
', NULL, '{"doh":"C","time":"C","soprano":":m |d'' :l |se :t |l :f |m :m |m :d'' |t :m |l :— |— || :l |r'' :-.d'' |t :l |l :s |s :d'' |d'' :-.d'' |m'' :r'' |d'' :— |— || d'' |d'' ||","alto":":m |m :m |m :m |m :r |t_1 :t_1 |m :m |re :r |d :— |— || :m |f :-.f |f :f |f :f |m :fe |s :-.s |s :f |m :— |— || f |m ||","tenor":":d'' |d'' :d'' |r'' :se |l :l |se :se |l :l |fe :se |l :— |— || :d'' |t :-.m'' |r'' :d'' |t :r'' |d'' :r'' |m'' :-.m'' |d'' :t |d'' :— |— || l |s ||","bass":":l |l :l |t :t_1 |d :r |m :r |d :l_1 |t_1 :m |l_1 :— |— || :l |s :-.s |s :s |s :t |d'' :l |s :-.s |s :s |d :— |— || f |d ||","lah":"A","mode":"minor"}', 'X:1
T:Corona
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Am
[V:1] e2c''2a2^g2 | b2a2f2e2 | e2e2c''2b2 | e2a6 | a2d''3c''b2 | a2a2g2g2 | c''2c''3c''e''2 | d''2c''6 | c''2c''2
[V:2] e2e2e2e2 | e2e2d2B2 | B2e2e2^d2 | d2c6 | e2f3ff2 | f2f2f2e2 | ^f2g3gg2 | f2e6 | f2e2
[V:3] c''2c''2c''2d''2 | ^g2a2a2^g2 | ^g2a2a2^f2 | ^g2a6 | c''2b3e''d''2 | c''2b2d''2c''2 | d''2e''3e''c''2 | b2c''6 | a2g2
[V:4] a2a2a2b2 | B2c2d2e2 | d2c2A2B2 | e2A6 | a2g3gg2 | g2g2b2c''2 | a2g3gg2 | g2c6 | f2c2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Corona
M:C
L:1/8
Q:1/4=76
K:Am
e2c''2a2^g2 | b2a2f2e2
% PHRASE_BREAK
 | e2e2c''2b2 | e2a6
% PHRASE_BREAK
 |
a2d''3c''b2 | a2a2g2g2
% PHRASE_BREAK
 | c''2c''3c''e''2 | d''2c''6 | c''2c''2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (82, 'recUqKRL4Xf5xE0a6', 'Artaxerxes (EPC tune)', 'CM', 'X:1
T:Artaxerxes (EPC tune)
M:C
L:1/8
K:G
g2bbb2a2 | ggg2a2bd'' | c''2b2b2a2 | c''2bbb2e''2 | d''d''d''2g2ab | c''b2a2g4', NULL, '{"doh":"G","time":"C","soprano":":d | m.,m :m :r | d.,d :d :r | m.,s :f :m | m :r || :f | m.,m :m :l | s.,s :s :d | r,m.f :m :r | d :— ||","alto":":d | d.,d :d :t_1 | l_1.,l_1 :l_1 :t_1 | d.,m :r :d | d :t_1 || :t_1 | d.,d :d :d | d.,d :d :d | d .d :d :t_1 | d :— ||","tenor":":m | s.,s :s :f | m.,m :m :s | s.,s :s :s | s :— || :r | m.,m :m :f | s.,s :s :s | l .l :s :s.f | m :— ||","bass":":d | d.,d :d :s_1 | l_1.,l_1 :l_1 :s_1 | d.,d :t_1 :d | s_1 :— || :s_1 | d.,d :d :f | m.,m :m :m_1 | f_1 .f_1 :s_1 :s_1 | d_1 :— ||"}', 'X:1
T:Artaxerxes (EPC tune)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2bbb2a2 | ggg2a2bd'' | c''2b2b2a2 | c''2bbb2e''2 | d''d''d''2g2zc'' | b2a2g4
[V:2] g2ggg2f2 | eee2f2gb | a2g2g2f2 | f2ggg2g2 | ggg2g2gg | g2f2g4
[V:3] b2d''d''d''2c''2 | bbb2d''2d''d'' | d''2d''2d''4 | a2bbb2c''2 | d''d''d''2d''2e''e'' | d''2d''c''b4
[V:4] g2ggg2d2 | eee2d2gg | f2g2d4 | d2ggg2c''2 | bbb2B2cc | d2d2G4', NULL, NULL, NULL, 'https://soundcloud.com/connorq/psalm-1-tune-arlington', 'sole start', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Artaxerxes (EPC tune)
M:C
L:1/8
Q:1/4=76
K:G
g2bbb2a2 | ggg2
% PHRASE_BREAK
a2bd'' |
c''2b2b2
% PHRASE_BREAK
a2 | c''2bbb2e''2 | d''d''
% PHRASE_BREAK
d''2g2zc'' | b2a2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (84, 'recVcGXvQZQ77TYAj', 'Elijah', 'CM', 'X:1
T:Elijah
M:C
L:1/8
Q:1/4=76
K:A
e2a4c''2 | b4d''2c''2 | e''2c''2
% PHRASE_BREAK
c''2b2 | b2e''4a2 |
g2
% PHRASE_BREAK
a2f2e4 | a2a2g2b2 | b2
% PHRASE_BREAK
a2c''2c''2 | b2d''2d''2c''2 | e2f2g2a2 | b2a2g2a4
', NULL, '{"doh":"A","time":"C","soprano":":s_1 | d :—:m | r :—:f | m :s :m | m :r :r | s :—:d | t_1:d :l_1 | s_1 :— || :d | d :t_1:r | r :d :m | m :r :f | f :m :s_1 | l_1:t_1:d | r :d :t_1 | d :— ||","alto":":m_1 | s_1 :—:s_1 | s_1 :—:s_1 | s_1:m_1:s_1 | s_1 :—:s_1 | s_1 :—:fe_1 | s_1:l_1:fe_1 | s_1 :— || :s_1 | s_1 :—:s_1 | s_1 :—:d | d :t_1:r | r :d :s_1 | f_1 :—:s_1 | l_1:s_1:f_1 | m_1 :— ||","tenor":":d | m :—:d | r :t_1:r | d :m :d | d :t_1:t_1 | d :—:r | r :m :r.d | t_1 :— || :m | m :r :f | f :m :s | s :—:s | s :—:d | d :r :m | f :m :r | d :— ||","bass":":d_1 | d_1:d :d | t_1:s_1:t_1 | d :—:d_1 | s_1 :—:s_1.f_1 | m_1 :—:l_1 | s_1:d_1:r_1 | s_1 :— || :d_1 | s_1 :—:t_1 | d :—:d | s_1 :—:t_1 | d :—:m_1 | f_1:r_1:d_1 | f_1:s_1:s_1 | d_1 :— ||"}', 'X:1
T:Elijah
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a4c''2 | b4d''2c''2 | e''2c''2c''2b2 | b2e''4a2 | g2a2f2e4 | a2a2g2b2 | b2a2c''2c''2 | b2d''2d''2c''2 | e2f2g2a2 | b2a2g2a4
[V:2] c2e4e2 | e4e2e2 | c2e2e4 | e2e4^d2 | e2f2^d2e4 | e2e4e2 | e4a2a2 | g2b2b2a2 | e2d4e2 | f2e2d2c4
[V:3] a2c''4a2 | b2g2b2a2 | c''2a2a2g2 | g2a4b2 | b2c''2bag4 | c''2c''2b2d''2 | d''2c''2e''2e''4 | e''2e''4a2 | a2b2c''2d''2 | c''2b2a4
[V:4] A2A2a2a2 | g2e2g2a4 | A2e4ed | c4f2e2 | A2B2e4 | A2e4g2 | a4a2e4 | g2a4c2 | d2B2A2d2 | e2e2A4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=x4Bi9iEuIqk&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Elijah
M:C
L:1/8
Q:1/4=76
K:A
e2a4c''2 | b4d''2c''2 | e''2c''2
% PHRASE_BREAK
c''2b2 | b2e''4a2 |
g2
% PHRASE_BREAK
a2f2e4 | a2a2g2b2 | b2
% PHRASE_BREAK
a2c''2c''2 | b2d''2d''2c''2 | e2f2g2a2 | b2a2g2a4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (83, 'recVNAOxBbA0eFdL5', 'Eastgate (last line repeat for Ps 133)', 'CM', 'X:1
T:Eastgate (last line repeat for Ps 133)
M:C
L:1/8
Q:1/4=76
K:D
a2d''2c''bba | a2b2
% PHRASE_BREAK
c''2d''2 | f2f2ga
% PHRASE_BREAK
a2 | gff2e2a2 |
bb
% PHRASE_BREAK
c''c''d''2e''2 | f''2d''c''bagf | g2baa4 | d''2d''d''d''2c''2 | d''4
', NULL, '{"doh":"D","time":"C","soprano":":s |d'' :t.l |l.s :s |l :t |d'' :m |m :f.s |s :f.m |m :r || :s |l .l :t .t |d'' :r'' |m'' :d''.t |l.s :f.m |f :l..s |s :— |d'' :d''.d'' |d'' :t |d'' :—||","alto":":m |m :s.f |f.m :m |d :f |m :d |de :r.d |r :r.d |d :t_1 || :m |f .f :f .f |m :s |s :l.s |f.m :r.d |r :f.m |m :— |m :s.f |m :r |m :—||","tenor":":s |s :d'' |d'' :d'' |l :s |s :s |l :l.s |s :s |s :— || :d'' |d'' .d'' :r'' .r'' |s :t |d'' : |: |: |: |s :d''.l |s :s |s :—||","bass":":d |d :d |d :d |f :r |d :d |s :f.m |t_1 :d |s_1 :— || :d |f .f :r .r |d :s |d'' : |: |: |: |d :m.f |s :s_1 |d :—||"}', 'X:1
T:Eastgate (last line repeat for Ps 133)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2d''2c''bba | a2b2c''2d''2 | f2f2gaa2 | gff2e2a2 | bbc''c''d''2e''2 | f''2d''c''bagf | g2baa4 | d''2d''d''d''2c''2 | d''4
[V:2] f2f2aggf | f2d2g2f2 | d2^d2e=de2 | edd2c2f2 | ggggf2a2 | a2bagfed | e2gff4 | f2agf2e2 | f4
[V:3] a2a2d''2d''2 | d''2b2a2a2 | a2b2baa2 | a2a4d''2 | d''d''e''e''a2c''2 | d''2a2d''ba2 | a2a4
[V:4] d2d2d2d2 | d2g2e2d2 | d2a2gfc2 | d2A4d2 | ggeed2a2 | d''2d2fga2 | A2d4', NULL, NULL, NULL, 'https://youtu.be/vu4HrCq03Xo?si=RcXROz5Bv3FnqkcX', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Eastgate (last line repeat for Ps 133)
M:C
L:1/8
Q:1/4=76
K:D
a2d''2c''bba | a2b2
% PHRASE_BREAK
c''2d''2 | f2f2ga
% PHRASE_BREAK
a2 | gff2e2a2 |
bb
% PHRASE_BREAK
c''c''d''2e''2 | f''2d''c''bagf | g2baa4 | d''2d''d''d''2c''2 | d''4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (88, 'recWUpsnRvAyR54Hk', 'Gabriel', 'CM', 'X:1
T:Gabriel
M:C
L:1/8
Q:1/4=76
K:E
g2g3eag | gfe6
% PHRASE_BREAK
 | e2e3ea2 |
e2g6
% PHRASE_BREAK
 | g2b3f=f^f | gag6
% PHRASE_BREAK
 | f2e3ed2 | f2e6
', NULL, '{"doh":"E","time":"C","soprano":":m |m :-.d |f .m:m .,r |d :- |- :d |d :-.d |f :d |m :- |- || :m |s :-.r |de,.r:m .,f |m :- |- :r |d :-.d |t_1 :r |d :- |- ||","alto":":d |d :-.d |d .d:t_1 .,t_1 |d :- |- :ta_1 |l_1 :-.l_1 |l_1 :se_1 |s_1 :- |- || :s_1 |t_1 :-.t_1 |ta_1.t_1:d .,r |d :- |- :l_1 |s_1 :-.s_1 |s_1 :s_1 |s_1 :- |- ||","tenor":":s |s :-.m |l .s:s .,f |m :- |- :m |f :-.f |f :f |m :- |- || :d |r :-.s |s .s:s .,s |s :- |- :f |m :-.m |r :f |m :- |- ||","bass":":d |d :-.d |d .d:s_1 .,s_1 |l_1 :- |- :s_1 |f_1 :-.f_1 |f_1 :f_1 |d :- |- || :d |s_1 :-.s_1 |s_1 .s_1:s_1 .,s_1 |d :- |- :f_1 |s_1 :-.s_1 |s_1 :s_1 |d :- |- ||"}', 'X:1
T:Gabriel
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] g2g3eag | gfe6 | e2e3ea2 | e2g6 | g2b3f=f^f | gag6 | f2e3ed2 | f2e6
[V:2] e2e3eee | dde6 | =d2c3cc2 | =c2B6 | B2d3d=d^d | efe6 | c2B3BB2 | B2B6
[V:3] b2b3gc''b | bag6 | g2a3aa2 | a2g6 | e2f3bbb | bbb6 | a2g3gf2 | a2g6
[V:4] e2e3eee | BBc6 | B2A3AA2 | A2e6 | e2B3BBB | BBe6 | A2B3BB2 | B2e6', NULL, NULL, NULL, 'https://youtu.be/4gIKbv3LaBw?si=U7TNG3D_zw0q21S1', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Gabriel
M:C
L:1/8
Q:1/4=76
K:E
g2g3eag | gfe6
% PHRASE_BREAK
 | e2e3ea2 |
e2g6
% PHRASE_BREAK
 | g2b3f=f^f | gag6
% PHRASE_BREAK
 | f2e3ed2 | f2e6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (97, 'recZIoZKjD0qlGYg7', 'St. Ethelreda', 'CM', 'X:1
T:St. Ethelreda
M:C
L:1/8
Q:1/4=76
K:F
f2f2g2a2 | g2f2e2f2
% PHRASE_BREAK
 | g2a2c''2b2 | a2g6
% PHRASE_BREAK
 |
a2b2d''2c''2 | e2f2b2a2
% PHRASE_BREAK
 | c''2d''2b2a2 | g2f6 | f2f2
', NULL, '{"doh":"F","time":"C","soprano":":d |d :r |m :r |d :t_1 |d :r |m :s |f :m |r :— |—|| :m |f :l |s :t_1 |d :f |m :s |l :f |m :r |d :— |—|| d |d||","alto":":s_1 |d :t_1 |d :l_1 |s_1 :s_1 |s_1 :t_1 |d :d |l_1.t_1:d |t_1 :— |—|| :d |d :d |d :s_1.f_1 |m_1 :s_1 |s_1 :ta_1 |l_1 :d |d :t_1 |d :— |—|| l_1 |s_1||","tenor":":m |m :s |s :f |m :r |m :s |s :m |f :s |s :— |—|| :s |f :f |s :m.r |d :r |d :d |d :f |s :-f |m :— |—|| f |m||","bass":":d |l_1 :s_1 |d :f_1 |s_1 :s_1 |d :s_1 |d :m |r :d |s_1 :— |—|| :d |l_1 :f_1 |m_1 :s_1 |l_1 :t_1 |d :m_1 |f_1 :l_1 |s_1 :s_1 |d :— |—|| f_1 |d||"}', 'X:1
T:St. Ethelreda
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2f2g2a2 | g2f2e2f2 | g2a2c''2b2 | a2g6 | a2b2d''2c''2 | e2f2b2a2 | c''2d''2b2a2 | g2f6 | f2f2
[V:2] c2f2e2f2 | d2c2c2c2 | e2f2f2de | f2e6 | f2f2f2f2 | cBA2c2c2 | _e2d2f2f2 | e2f6 | d2c2
[V:3] a2a2c''2c''2 | b2a2g2a2 | c''2c''2a2b2 | c''2c''6 | c''2b2b2c''2 | agf2g2f2 | f2f2b2c''2 | z2a6 | b2a2
[V:4] f2d2c2f2 | B2c2c2f2 | c2f2a2g2 | f2c6 | f2d2B2A2 | c2d2e2f2 | A2B2d2c2 | c2f6 | B2f2', NULL, NULL, NULL, 'https://youtu.be/eah1WIA4q3k?si=TZuIv88_X0fIwu_7', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Ethelreda
M:C
L:1/8
Q:1/4=76
K:F
f2f2g2a2 | g2f2e2f2
% PHRASE_BREAK
 | g2a2c''2b2 | a2g6
% PHRASE_BREAK
 |
a2b2d''2c''2 | e2f2b2a2
% PHRASE_BREAK
 | c''2d''2b2a2 | g2f6 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (99, 'recaf4QbX5ymRhZZe', 'Carlisle', 'SM', 'X:1
T:Carlisle
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_g2=B2e_d | =B _B =B6
w: The mig- hty God, _ the _ Lord,
% PHRASE_BREAK
| =B2=e2_ga _g2 =B =e _e2 _d4
w: hath spo- ken, _ and did _ call _
% PHRASE_BREAK
| _d2e2_d =B =e2 e _d _g2 =e _e a2
w: The earth, from _ ri- sing _ of the _ sun,
% PHRASE_BREAK
| b2=b2=B=e_e2 | _d2=B6
w: to where he _ hath his fall.', NULL, '{"doh":"Eb","time":"C","soprano":":d |s :d |m.r:d.t_1|d :— |— :d |f :s.l |s :d.f|m :r |—|| :r |m :r.d|f :m.r|s :f.m|l :t |d'' :d.f|m :r |d :— |—||","alto":":s_1|s_1 :l_1|l_1 :s_1|s_1 :— |— :s_1|d :d |d :l_1.r|d :t_1|—|| :t_1|d :t_1.d|r :d.t_1|d :d |d :r |d :d.r|d :t_1|d :— |—||","tenor":":m |r :m |f :m.r|m :— |— :m |f :m.f|s :l |s :— |—|| :s |s :s |l :s |s :d''.ta|l :f |s :l |s :-.f|m :— |—||","bass":":d |t_1 :l_1|f_1 :s_1|d :— |— :d.t_1|l_1 :s_1.f_1|m_1 :f_1|s_1 :— |—|| :s_1|d :f_1.m|r :s_1.f|m :l_1.s|f :r |m :f.r|s :s_1|d :— |—||"}', 'X:1
T:Carlisle
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2_g2=B2e_d | =B_B=B6 | =B2=e2_ga_g2 | =B=e_e2_d4 | _d2e2_d=B=e2 | e_d_g2=e_ea2 | b2=b2=B=e_e2 | _d2=B6
[V:2] _G2_G2A2A2 | _G2_G6 | _G2=B2=B2=B2 | A_d=B2_B4 | B2=B2_B=B_d2 | =B_B=B2=B2=B2 | _d2=B2=B_d=B2 | B2=B6
[V:3] e2_d2e2=e2 | e_de6 | e2=e2_e=e_g2 | a2_g6 | _g2_g2_g2a2 | _g2_g2=b=a_a2 | =e2_g2a2_g3 | =e_e6
[V:4] =B2_B2A2=E2 | _G2=B6 | =B_BA2_G=E_E2 | =E2_G6 | _G2=B2=Ee_d2 | _G=e_e2A_g=e2 | _d2e2=e_d_g2 | _G2=B6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=0eKCkZONs7Y', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Carlisle
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_g2=B2e_d | =B
% PHRASE_BREAK
_B=B6 | =B2=e2_ga
% PHRASE_BREAK
_g2 |
=B=e_e2_d4 | _d2e2_d
% PHRASE_BREAK
=B=e2 | e_d_g2=e_ea2 | b2=b2=B=e_e2 | _d2=B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (94, 'recYasnnU2htHJ9eK', 'St. James', 'CM', 'X:1
T:St. James
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2c2d2 | B2c2e2d2
% PHRASE_BREAK
 | d2G2A2B2 | G2F6
% PHRASE_BREAK
 |
c2d2B2e2 | d2G2c2A2
% PHRASE_BREAK
 | F2B2d2e2 | c2B6 | B2B2
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |d :r |m :d |r :f |m :m |l_1 :t_1 |d :l_1 |s_1 :— |— || :r |m :d |f :m |l_1 :r |t_1 :s_1 |d :m |f :r |d :— |— || d |d ||","alto":":m_1 |s_1 :s_1 |s_1 :s_1 |l_1 :s_1 |s_1 :s_1 |fe_1 :s_1 |s_1 :fe_1 |s_1 :— |— || :s_1 |s_1 :s_1 |f_1 :s_1 |l_1 :l_1 |s_1 :r_1 |s_1 :m_1 |l_1 :s_1.f_1 |m_1 :— |— || f_1 |m_1 ||","tenor":":d |d :t_1 |d :d |d :t_1 |d :m |r :r |m :r.d |t_1 :— |— || :t_1 |d :d |t_1 :d |d :f |r :t_1 |d :d |d :t_1 |d :— |— || l_1 |s_1 ||","bass":":d_1 |m_1 :s_1 |d :m_1 |f_1 :s_1 |d_1 :d_1 |r_1 :s_1 |d_1 :r_1 |s_1 :— |— || :s_1 |d_1 :m_1 |r_1 :d_1 |f_1 :r_1 |s_1 :s_1.f_1 |m_1 :d_1 |r_1 :s_1 |d_1 :— |— || f_1 |d_1 ||"}', 'X:1
T:St. James
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2B2c2d2 | B2c2e2d2 | d2G2A2B2 | G2F6 | c2d2B2e2 | d2G2c2A2 | F2B2d2e2 | c2B6 | B2B2
[V:2] D2F2F2F2 | F2G2F2F2 | F2=E2F2F2 | =E2F6 | F2F2F2E2 | F2G2G2F2 | C2F2D2G2 | FED6 | E2D2
[V:3] B2B2A2B2 | B2B2A2B2 | d2c2c2d2 | cBA6 | A2B2B2A2 | B2B2e2c2 | A2B2B2B2 | A2B6 | G2F2
[V:4] B,2D2F2B2 | D2E2F2B,2 | B,2C2F2B,2 | C2F6 | F2B,2D2C2 | B,2E2C2F2 | FED2B,2C2 | F2B,6 | E2B,2', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. James
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2c2d2 | B2c2e2d2
% PHRASE_BREAK
 | d2G2A2B2 | G2F6
% PHRASE_BREAK
 |
c2d2B2e2 | d2G2c2A2
% PHRASE_BREAK
 | F2B2d2e2 | c2B6 | B2B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (104, 'recbihomKs45b01pQ', 'Erin', 'CM', 'X:1
T:Erin
M:C
L:1/8
Q:1/4=76
K:F
f2a4b2 | c''4b2a4 | g2f4
% PHRASE_BREAK
g2 | a4b2c''2 | b2d''2
% PHRASE_BREAK
c''4 |
c''2f''4d''2 | c''4b2a4 | g2
% PHRASE_BREAK
f4a2 | c''4b2a4 | g2f4f2 | f2
', NULL, '{"doh":"F","time":"C","soprano":":d |m :—:f |s :—:f |m :—:r |d :—:r |m :—:f |s :f :l |s :—|| :s |d'' :—:l |s :—:f |m :—:r |d :—:m |s :—:f |m :—:r |d :—|| d | d ||","alto":":d |d :—:d |d :t_1 :l_1 |s_1 :—:t_1 |l_1 :—:t_1 |d :—:d |d :—:d |d :—|| :r |d :—:d |d :m :r |d :—:t_1 |l_1 :—:d |d :t_1 :l_1 |s_1 :—:t_1 |d :—|| l_1 | s_1 ||","tenor":":m |s :—:l |s :—:d |d :s :f |m :—:s |s :—:f |ta :l :f |m :—|| :s |m :—:f |s :—:l |s :—:f |m :—:l |s :—:d |d :s :f |m :—|| f | m ||","bass":":d |d :—:l_1 |m_1 :—:f_1 |s_1 :—:s_1 |l_1 :—:s_1 |d :—:r |m :f :f_1 |d :—|| :t_1 |l_1 :s_1 :f_1 |m_1 :—:f_1 |s_1 :—:se_1 |l_1 :—:l_1 |m_1 :—:f_1 |s_1 :—:s_1 |d :—|| f_1 | d_1 ||"}', 'X:1
T:Erin
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2a4b2 | c''4b2a4 | g2f4g2 | a4b2c''2 | b2d''2c''4 | c''2f''4d''2 | c''4b2a4 | g2f4a2 | c''4b2a4 | g2f4f2 | f2
[V:2] f2f4f2 | f2e2d2c4 | e2d4e2 | f4f2f4 | f2f4g2 | f4f2f2 | a2g2f4 | e2d4f2 | f2e2d2c4 | e2f4d2 | c2
[V:3] a2c''4d''2 | c''4f2f2 | c''2b2a4 | c''2c''4b2 | _e''2d''2b2a4 | c''2a4b2 | c''4d''2c''4 | b2a4d''2 | c''4f2f2 | c''2b2a4 | b2a2
[V:4] f2f4d2 | A4B2c4 | c2d4c2 | f4g2a2 | b2B2f4 | e2d2c2B2 | A4B2c4 | _d2=d4d2 | A4B2c4 | c2f4B2 | F2', NULL, NULL, NULL, 'https://youtu.be/cHxpdzqiN2Y?si=gN586hMZ0XSoVvZ-', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Erin
M:C
L:1/8
Q:1/4=76
K:F
f2a4b2 | c''4b2a4 | g2f4
% PHRASE_BREAK
g2 | a4b2c''2 | b2d''2
% PHRASE_BREAK
c''4 |
c''2f''4d''2 | c''4b2a4 | g2
% PHRASE_BREAK
f4a2 | c''4b2a4 | g2f4f2 | f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (101, 'recayCroHEVa8fho1', 'Westminster', 'CM', 'X:1
T:Westminster
M:C
L:1/8
Q:1/4=76
K:C
e2g2g2c2 | c''2b2a2g2
% PHRASE_BREAK
 | g2e''2b2c''2 | d''2g6
% PHRASE_BREAK
 |
g2b2a2^g2 | a2c''2b2a2
% PHRASE_BREAK
 | a2g2c2d2 | f2e6 | f2e2
', NULL, '{"doh":"C","time":"C","soprano":":m |s :s |d :d'' |t :l |s :s |m'' :t |d'' :r'' |s :— |— || :s |t :l |se :l |d'' :t |l :l |s :d |r :f |m :— |— || f |m ||","alto":":d |m :r |d :m |m :d.r |m :f |m :s.f |m :f.m |r :— |— || :r |r :r |r :d |m :m.r |d :f |m :d |d :t_1 |d :— |— || d |d ||","tenor":":s |s :r |m :d'' |m'' :l.t |d'' :t |d'' :m''.r'' |d'' :l |t :— |— || :t |s :l |t :l |l :se |l :r'' |s :s |l :s |s :— |— || l |s ||","bass":":d |d :t_1 |l_1 :l |s :f |m :r |d :s |l :f |s :— |— || :s |s :f |m :f |m :m |l_1 :t_1 |d :m |f :s |d :— |— || f |d ||"}', 'X:1
T:Westminster
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] e2g2g2c2 | c''2b2a2g2 | g2e''2b2c''2 | d''2g6 | g2b2a2^g2 | a2c''2b2a2 | a2g2c2d2 | f2e6 | f2e2
[V:2] c2e2d2c2 | e2e2cde2 | f2e2gfe2 | fed6 | d2d2d2d2 | c2e2edc2 | f2e2c2c2 | B2c6 | c2c2
[V:3] g2g2d2e2 | c''2e''2abc''2 | b2c''2e''d''c''2 | a2b6 | b2g2a2b2 | a2a2^g2a2 | d''2g2g2a2 | g2g6 | a2g2
[V:4] c2c2B2A2 | a2g2f2e2 | d2c2g2a2 | f2g6 | g2g2f2e2 | f2e2e2A2 | B2c2e2f2 | g2c6 | f2c2', NULL, NULL, NULL, 'https://youtu.be/MOxEmPR7sD0?si=eA0t4Rf8IBzQ_mGr', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Westminster
M:C
L:1/8
Q:1/4=76
K:C
e2g2g2c2 | c''2b2a2g2
% PHRASE_BREAK
 | g2e''2b2c''2 | d''2g6
% PHRASE_BREAK
 |
g2b2a2^g2 | a2c''2b2a2
% PHRASE_BREAK
 | a2g2c2d2 | f2e6 | f2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (110, 'recdMbONFBaFoXqXg', 'Warwick', 'CM', 'X:1
T:Warwick
M:C
L:1/8
Q:1/4=76
K:E
e2gbe''c''b2 | ac''
% PHRASE_BREAK
bgf2e2 | g2b2
% PHRASE_BREAK
c''e''d''c'' |
b^ab4b2
% PHRASE_BREAK
 | c''ae''c''b2g2 | afbag2b2 | c''d''e''f''e''2d''2 | e''4
', NULL, '{"doh":"E","time":"C","soprano":":d |m.s:d''.l |s :f.l |s.m:r |d :m |s :l.d'' |t.l :s.fe |s :—||:s |l.f:d''.l |s :m |f.r:s.f |m :s |l.t:d''.r'' |d'' :t |d'' :—||","alto":":d |d :d |d :d |d :t_1 |d :d |r :m |r.d:t_1.d |t_1 :—||:d |d :d |d :d |l_1 :t_1 |d :d |d.f:m.r |m :r.f |m :—||","tenor":":m |s.m:l.f |m :f |m.s:f |m :s |s :s |s.fe:s.l |s :—||:m |f.l:l.d'' |d'' :s |f :s |s :s |f :s.l |s :s |s :—||","bass":":d |d :d |d :l_1.f_1 |s_1 :s_1 |d :d |t_1 :d |r :r |s_1 :—||:d |f :f |m :d |r :s_1 |d :m |f.r:m.f |s :s_1 |d :—||"}', 'X:1
T:Warwick
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] e2gbe''c''b2 | ac''bgf2e2 | g2b2c''e''d''c'' | b^ab4b2 | c''ae''c''b2g2 | afbag2b2 | c''d''e''f''e''2d''2 | e''4
[V:2] e2e2e2e2 | e2e2d2e2 | e2f2g2fe | ded4e2 | e2e2e2e2 | c2d2e2e2 | eagfg2fa | g4
[V:3] g2bgc''ag2 | a2gba2g2 | b2b2b2b^a | bc''b4g2 | ac''c''e''e''2b2 | a2b2b2b2 | a2bc''b2b2 | b4
[V:4] e2e2e2e2 | cAB2B2e2 | e2d2e2f2 | f2B4e2 | a2a2g2e2 | f2B2e2g2 | afgab2B2 | e4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=78Sz1bdzAsw&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Warwick
M:C
L:1/8
Q:1/4=76
K:E
e2gbe''c''b2 | ac''
% PHRASE_BREAK
bgf2e2 | g2b2
% PHRASE_BREAK
c''e''d''c'' |
b^ab4b2
% PHRASE_BREAK
 | c''ae''c''b2g2 | afbag2b2 | c''d''e''f''e''2d''2 | e''4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (85, 'recVdvIIkikUaihzb', 'Richmond', 'CM', 'X:1
T:Richmond
M:C
L:1/8
Q:1/4=76
K:G
d2d2g2b2 | d''4c''2b2 | c''2
% PHRASE_BREAK
a2g4 | b2a2d''2g2
% PHRASE_BREAK
 |
f2g2e2d4 | a2b2a2g2
% PHRASE_BREAK
 | c''2b2a2d''2 | c''2b2e''4 | d''2e2c''2b2 | bag2f2g6
', NULL, '{"doh":"G","time":"C","soprano":":s_1 | s_1 :d :m | s :- :f | m :f :r | d :- :m | r :s :d | t_1 :d :l_1 | s_1 :-|| :r | m :r :d | f :m :r | s :f :m | l :- :s | l_1 :f :m | m.r :d :t_1 | d :-:-||","alto":":m_1 :s_1 :d | r :t_1 :l_1 | s_1 :l_1 :f_1 | m_1 :- :fe_1 | s_1 :- :l_1 | s_1 :- :fe_1 | s_1 :-|| :s_1 | s_1 :- :l_1 | f_1 :- :s_1.l_1 | ta_1 :- :ta_1 | l_1 :- :d | l_1 :t_1 :d | l_1 :s_1 :s_1 | s_1 :-:-||","tenor":":d :m :s | s :- :d.r | m :d :t_1 | d :- :d | r :- :m | r :- :d | t_1 :-|| :t_1 | d :t_1 :l_1 | r :d :t_1 | d :r :m | d :- :s | f :- :s | f :m :r | m :-:-||","bass":":d :d :d | t_1 :s_1 :l_1.t_1 | d :f_1 :s_1 | d_1 :- :l_1 | t_1 :- :d | r :- :d | s_1 :-|| :f_1 | m_1 :- :l_1 | r_1 :- :f_1 | m_1 :r_1 :d_1 | f_1 :- :m_1 | m_1 :r_1 :d_1 | f_1 :s_1 :s_1 | d_1 :-:-||"}', 'X:1
T:Richmond
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2d2g2b2 | d''4c''2b2 | c''2a2g4 | b2a2d''2g2 | f2g2e2d4 | a2b2a2g2 | c''2b2a2d''2 | c''2b2e''4 | d''2e2c''2b2 | bag2f2g6
[V:2] B2d2g2a2 | f2e2d2e2 | c2B4^c2 | d4e2d4 | ^c2d4d2 | d4e2c4 | de=f4=f2 | e4g2e2 | f2g2e2d2 | d2d6
[V:3] g2b2d''2d''4 | gab2g2f2 | g4g2a4 | b2a4g2 | f4f2g2 | f2e2a2g2 | f2g2a2b2 | g4d''2c''4 | d''2c''2b2a2 | b6
[V:4] g2g2g2f2 | d2efg2c2 | d2G4e2 | f4g2a4 | g2d4c2 | B4e2A4 | c2B2A2G2 | c4B2B2 | A2G2c2d2 | d2G6', NULL, NULL, NULL, 'https://youtu.be/rK9Zpnmt4KQ?si=uJWAnxBfNiLRqwLd', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Richmond
M:C
L:1/8
Q:1/4=76
K:G
d2d2g2b2 | d''4c''2b2 | c''2
% PHRASE_BREAK
a2g4 | b2a2d''2g2
% PHRASE_BREAK
 |
f2g2e2d4 | a2b2a2g2
% PHRASE_BREAK
 | c''2b2a2d''2 | c''2b2e''4 | d''2e2c''2b2 | bag2f2g6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (116, 'receYQ7WcEScIkUWt', 'Howard', 'CM', 'X:1
T:Howard
M:C
L:1/8
Q:1/4=76
K:A
c''2c''2e''2d''2 | c''2b2a2b2
% PHRASE_BREAK
 | f2g2a4 | b2c''2^d''2
% PHRASE_BREAK
e''2 |
bag2f2e4 | a2b4
% PHRASE_BREAK
c''2 | d''4c''2b2 | c''2a2a2g2 | e2e''2d''2c''2 | b2f2g2a4
', NULL, '{"doh":"A","time":"C","soprano":":m | m:s:f | m:r:d | r:l_1:t_1 | d:—:r | m:fe:s | r.d:t_1:l_1 | s_1:— || :d | r:—:m | f:—:m | r:m:d | d:t_1:s_1 | s:f:m | r:l_1:t_1 | d:— ||","alto":":s_1 | s_1:—:s_1 | s_1:t_1:d | l_1:—:s_1 | s_1:—:s_1 | s_1:l_1:s_1 | s_1:—:fe_1 | s_1:— || :s_1 | s_1:—:s_1 | f_1:—:s_1 | l_1:s_1:m_1.f_1 | s_1:—:s_1 | s_1:t_1:d | l_1:—:s_1 | s_1:— ||","tenor":":d | d:m:r | s:f:m | r:—:f | m:—:t_1 | d:—:r | m:r:d | t_1:— || :d | t_1:—:d | d:—:d.t_1 | l_1:t_1:d.r | m:r:t_1 | d:r:m | f:—:r | m:— ||","bass":":d | d:—:t_1 | d:s_1:l_1 | f_1:—:s_1 | d_1:—:s_1 | d:l_1:t_1 | d:r:r_1 | s_1:— || :m_1 | s_1:—:d.ta_1 | l_1:—:s_1 | f_1:s_1:l_1 | s_1:—:s_1.f_1 | m_1:r_1:d_1 | f_1:—:s_1 | d_1:— ||"}', 'X:1
T:Howard
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] c''2c''2e''2d''2 | c''2b2a2b2 | f2g2a4 | b2c''2^d''2e''2 | bag2f2e4 | a2b4c''2 | d''4c''2b2 | c''2a2a2g2 | e2e''2d''2c''2 | b2f2g2a4
[V:2] e2e4e2 | e2g2a2f4 | e2e4e2 | e2f2e2e4 | ^d2e4e2 | e4e2d4 | e2f2e2cd | e4e2e2 | g2a2f4 | e2e4
[V:3] a2a2c''2b2 | e''2d''2c''2b4 | d''2c''4g2 | a4b2c''2 | b2a2g4 | a2g4a2 | a4agf2 | g2abc''2b2 | g2a2b2c''2 | d''4b2c''4
[V:4] a2a4g2 | a2e2f2d4 | e2A4e2 | a2f2g2a2 | b2B2e4 | c2e4a=g | f4e2d2 | e2f2e4 | edc2B2A2 | d4e2A4', NULL, NULL, NULL, 'https://hymnary.org/media/fetch/108763', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Howard
M:C
L:1/8
Q:1/4=76
K:A
c''2c''2e''2d''2 | c''2b2a2b2
% PHRASE_BREAK
 | f2g2a4 | b2c''2^d''2
% PHRASE_BREAK
e''2 |
bag2f2e4 | a2b4
% PHRASE_BREAK
c''2 | d''4c''2b2 | c''2a2a2g2 | e2e''2d''2c''2 | b2f2g2a4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (117, 'recevKME9FW90CIAl', 'Comfort', 'CM', 'X:1
T:Comfort
M:C
L:1/8
Q:1/4=76
K:Ab
E2A2A2ed | c2F2G2
% PHRASE_BREAK
A2 | E2d2c2cB
% PHRASE_BREAK
 | AGA6 |
e2f2e2d2 | B2
% PHRASE_BREAK
c2=d2e2 | AEF2d2c2 | cBA6 | A2A2
', NULL, '{"doh":"Ab","time":"C","soprano":":s_1 |d :d |s.f:m |l_1 :t_1 |d :s_1 |f :m |m.r:d.t_1 |d :— |— || :s |l :s |f :r |m :fe |s :d.s_1 |l_1 :f |m :m.r |d :— |— || d | d ||","alto":":m_1 |s_1 :d |t_1 :d |l_1 :s_1.f_1 |m_1 :s_1 |s_1 :s_1 |l_1 :s_1 |s_1 :— |— || :d |d :d |d :s_1 |s_1 :d |t_1 :s_1 |f_1 :f_1 |s_1 :f_1 |m_1 :— |— || f_1 | m_1 ||","tenor":":d |m :d |r :d |f.m:r |d :m |r :d.s |s.f:m.r |m :— |— || :d |f :m |d :s.f |m :d |r :d |d :d |d :t_1 |d :— |— || l_1 | s_1 ||","bass":":d_1 |d :l_1 |s_1 :l_1 |f_1 :s_1 |d_1 :d |t_1 :d |f_1 :s_1 |d_1 :— |— || :m_1 |f_1 :s_1 |l_1 :t_1 |d :l_1 |s_1 :m_1 |f_1 :l_1 |s_1 :s_1 |d_1 :— |— || f_1 | d_1 ||"}', 'X:1
T:Comfort
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] E2A2A2ed | c2F2G2A2 | E2d2c2cB | AGA6 | e2f2e2d2 | B2c2=d2e2 | AEF2d2c2 | cBA6 | A2A2
[V:2] C2E2A2G2 | A2F2EDC2 | E2E2E2F2 | E2E6 | A2A2A2A2 | E2E2A2G2 | E2D2D2E2 | D2C6 | D2C2
[V:3] A2c2A2B2 | A2dcB2A2 | c2B2Aeed | cBc6 | A2d2c2A2 | edc2A2B2 | A2A2A2A2 | G2A6 | F2E2
[V:4] A,2A2F2E2 | F2D2E2A,2 | A2G2A2D2 | E2A,6 | C2D2E2F2 | G2A2F2E2 | C2D2F2E2 | E2A,6 | D2A,2', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Comfort
M:C
L:1/8
Q:1/4=76
K:Ab
E2A2A2ed | c2F2G2
% PHRASE_BREAK
A2 | E2d2c2cB
% PHRASE_BREAK
 | AGA6 |
e2f2e2d2 | B2
% PHRASE_BREAK
c2=d2e2 | AEF2d2c2 | cBA6 | A2A2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (120, 'recgltphNAJnsapC9', 'Shepherd', '87 87', 'X:1
T:Shepherd
M:C
L:1/8
Q:1/4=76
K:G
b2d''2c''2b2 | b2a2a2g2 | d2d3ef''2 | g2b4a2 | d''2c''2bab2 | b2a2gfg2 | eed3ef2 | g2b2a2g2', NULL, '{"doh":"G","time":"C","soprano":":m | s :f |m :m | r :r |d :s_1 | s_1 :-.l_1 |t :d | m :- |r || :s | f :m.r |m :m | r :d.t_1 |d :l_1.l_1 | s_1 :-.l_1 |t_1 :d | m :r |d ||","alto":":s_1 | t_1 :l_1 |s_1 :d | d :t_1 |l_1 :s_1 | s_1 :-.s_1 |fe_1 :fe_1 | s_1 :d |t_1 || :d | d :t_1 |d :l_1 | l_1 :se_1 |l_1 :m_1.f_1 | f_1 :- |f_1 :s_1 | t_1 :- |d ||","tenor":":m | r :d.r |m :s | f.m :f |m :r.f | f :m |r :d | d :-.m |s || :s | l :s |s :m | f :m |m :d.d | t_1 :-.d |r :m | f :- |m ||","bass":":d | s_1 :l_1.t_1 |d :m_1.f_1 | s_1 :s_1 |l_1 :t_1 | d :d |l_1 :l_1 | s_1 :- |s_1 || :m | r :s_1 |d :d | t_1 :m_1 |l_1 :l_1.f_1 | s_1 :- |s_1 :s_1 | s_1 :- |d_1 ||"}', 'X:1
T:Shepherd
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] b2d''2c''2b2 | b2a2a2g2 | d2d3ef''2 | g2b4a2 | d''2c''2bab2 | b2a2gfg2 | eed3ef2 | g2b2a2g2
[V:2] d2f2e2d2 | g2g2f2e2 | d2d3d^c2 | ^c2d2g2f2 | g2g2f2g2 | e2e2^d2e2 | Bcc4c2 | d2f4g2
[V:3] b2a2gab2 | d''2c''bc''2b2 | ac''c''2b2a2 | g2g3bd''2 | d''2e''2d''2d''2 | b2c''2b2b2 | ggf3ga2 | b2c''4b2
[V:4] g2d2efg2 | Bcd2d2e2 | f2g2g2e2 | e2d4d2 | b2a2d2g2 | g2f2B2e2 | ecd4d2 | d2d4G2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=nWfZ-8s71-k&t=27s&ab_channel=ChetValleyChurches', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Shepherd
M:C
L:1/8
Q:1/4=76
K:G
b2d''2c''2b2 | b2a2a2g2 | d2d3ef''2 | g2b4a2 | d''2c''2bab2 | b2a2gfg2 | eed3ef2 | g2b2a2g2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (95, 'recYspgy4ibbSPcC5', 'Bishopthorpe', 'CM', 'X:1
T:Bishopthorpe
M:C
L:1/8
Q:1/4=76
K:G
d''2b4g2 | e4c''2b2 | g2f2
% PHRASE_BREAK
g4 | a2b2c''2d''2 | d''2
% PHRASE_BREAK
c''2b2b2 |
a2d''2d''2c''2 | b2
% PHRASE_BREAK
c''4c''2 | c''2b2a2b4 | d''2b3agf | eag2f2g4 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":s |m :—:d |l_1 :—:f |m :d :t_1 |d :—:r |m :f :s |s :f :m |m :r || :s |s :f :m |f :—:f |f :m :r |m :—:s |m :—.r :d.t_1 |l_1.r:d :t_1 |d :— || d | d ||","alto":":s_1 |s_1 :—:s_1 |f_1 :—:l_1 |s_1 :—:s_1 |s_1 :—:t_1 |d :—:d |d :s_1 :s_1 |s_1 :— || :s_1 |l_1 :— l_1 |l_1 :—:l_1 |s_1 :—:s_1 |s_1 :—:s_1 |s_1 :—.f_1 :m_1 |l_1 :s_1 :s_1 |s_1 :— || l_1 | s_1 ||","tenor":":m |d :—:d |d :—:d |d :m :r |m :—:s |s :f :m |m :r :d |d :t_1 || :t_1 |d e:r :d e|r :—:d |t_1 :d :t_1 |d :—:t_1 |d :t_1 :d |d.f :m :r |m :— || f | m ||","bass":":d_1 |d :—:m_1 |f_1 :—:r_1 |s_1 :—:s_1 |d_1 :—:s_1 |d :l_1 :m_1 |l_1 :t_1 :d |s_1 :— || :m_1 |l_1 :—:l_1 |r_1 :—:r_1 |s_1 :—:s_1 |d_1 :—:s_1 |d :s_1 :l_1 |f_1 :s_1 :s_1 |d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Bishopthorpe
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d''2b4g2 | e4c''2b2 | g2f2g4 | a2b2c''2d''2 | d''2c''2b2b2 | a2d''2d''2c''2 | b2c''4c''2 | c''2b2a2b4 | d''2b3agf | eag2f2g4 | g2g2
[V:2] d2d4d2 | c4e2d4 | d2d4f2 | g4g2g2 | d2d2d4 | d2e2z2e4 | e2d4d2 | d4d2d3 | cB2e2d2d2 | d4e2d2
[V:3] b2g4g2 | g4g2g2 | b2a2b4 | d''2d''2c''2b2 | b2a2g2g2 | f2f2z2a2 | z2a4g2 | f2g2f2g4 | f2g2f2g2 | gc''b2a2b4 | c''2b2
[V:4] G2g4B2 | c4A2d4 | d2G4d2 | g2e2B2e2 | f2g2d4 | B2e4e2 | A4A2d4 | d2G4d2 | g2d2e2c2 | d2d2G4 | c2G2', NULL, NULL, NULL, 'https://soundcloud.com/connorq/psalm-89-tune-bishopthorpe', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Bishopthorpe
M:C
L:1/8
Q:1/4=76
K:G
d''2b4g2 | e4c''2b2 | g2f2
% PHRASE_BREAK
g4 | a2b2c''2d''2 | d''2
% PHRASE_BREAK
c''2b2b2 |
a2d''2d''2c''2 | b2
% PHRASE_BREAK
c''4c''2 | c''2b2a2b4 | d''2b3agf | eag2f2g4 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (161, 'recvSuWgsIN8mJWx9', 'University', 'CM', 'X:1
T:University
M:C
L:1/8
Q:1/4=76
K:D
a2gfedd''2 | e''f''
% PHRASE_BREAK
a2g2f2 | a2fd
% PHRASE_BREAK
bag2 |
f2e4a2 | d''2d''
% PHRASE_BREAK
c''b2a2 | d2efg3a | bd''agf2e2 | d4
', NULL, '{"doh":"D","time":"C","soprano":":s |f.m:r.d |d'' :r''.m'' |s :f |m :s |m.d:l.s |f :m |r :— ||:s |d'' :d''.t |l :s |d :r.m |f :-.s |l.d'':s.f |m :r |d :— ||","alto":":m |r.d:t_1.d |s :f.m |r :t_1 |d :r |d :d |t_1 :d |t_1 :— ||:t_1 |d.r:m |f :d |d.s_1:s_1.d |d :-.d |d :d |d :t_1 |d :— ||","tenor":":d'' |l.s:f.m |s :s |s :s |s :t |d''.s:f.s |s :s |s :— ||:s |s :d'' |d'' :s |m :s |l :-.d'' |l.f:s.l |s :f |m :— ||","bass":":d |d :d |m :r.d |t_1 :s_1 |d :s_1 |d.m:f.m |r :d |s_1 :— ||:s |m :d |f :m.d |d :ta_1 |l_1 :-.m |f :m.f |s :s_1 |d :— ||"}', 'X:1
T:University
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2gfedd''2 | e''f''a2g2f2 | a2fdbag2 | f2e4a2 | d''2d''c''b2a2 | d2efg3a | bd''agf2e2 | d4
[V:2] f2edcda2 | gfe2c2d2 | e2d2d2c2 | d2c4c2 | def2g2d2 | dAAdd3d | d2d2d2c2 | d4
[V:3] d''2bagfa2 | a2a2a2a2 | c''2d''agaa2 | a2a4a2 | a2d''2d''2a2 | f2a2b3d'' | bgaba2g2 | f4
[V:4] d2d2d2f2 | edc2A2d2 | A2dfgfe2 | d2A4a2 | f2d2g2fd | d2=c2B3f | g2fga2A2 | d4', NULL, NULL, NULL, 'https://youtu.be/IqKCh0FfSPU?si=ITBdKtBjZkBUCkd7', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:University
M:C
L:1/8
Q:1/4=76
K:D
a2gfedd''2 | e''f''
% PHRASE_BREAK
a2g2f2 | a2fd
% PHRASE_BREAK
bag2 |
f2e4a2 | d''2d''
% PHRASE_BREAK
c''b2a2 | d2efg3a | bd''agf2e2 | d4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (118, 'recg16G0nBMAFzsCi', 'Petersham (CMD, EPC tune)', 'CM', 'X:1
T:Petersham (CMD, EPC tune)
M:C
L:1/8
Q:1/4=76
K:D
d2f2a2d''2 | b2a3gf2
% PHRASE_BREAK
 | f2e2a2b2 | b2a6
% PHRASE_BREAK
 | a2a2f2d''2 | b2a3gf2
% PHRASE_BREAK
 | f2b2bc''d''2 | c''2b6 |
a2f3ed2 | e2f2g2a2 | a2b3ab2 | b2c''6 | a2d''3c''b2 | a2a3gf2 | f2g2g2e2 | e2d6 | d2d2', NULL, '{"doh":"D","time":"C","soprano":":d |m :s |d'' :l |s :-.f |m :m |r :s |l :l |s :— |—|| :s |s :m |d'' :l |s :-.f |m :m |l :l.t |d'' :t |l :— |—|| :s |m :-.r |d :r |m :f |s :s |l :-.s |l :l |t :— |—|| :s |d'' :-.t |l :s |s :-.f |m :m |f :f |r :r |d :— |—|| d |d||","alto":":d |m :s |d'' :f |r :r |m :d |r :t_1 |r :-.d |t_1 :— |—|| :s |s :m |m :f.m |r :t_1 |d :r |d :r |m :-.r |d :— |—|| :r |d :t_1 |l_1 :r |d :d |d :s |f :-.s |f :f |f :— |—|| :r |s :m |f :m |r :d.r |d :d |d :d |d :t_1 |d :— |—|| l_1 |s_1||","tenor":":d |m :s |d'' :d'' |d'' :t |d'' :s |s :s |s :fe |s :— |—|| :s |s :m |s :f |s :s |s :se |l :l |l :se |d :— |—|| :r |s :f |m :s |s :s |s :d'' |d'' :-.d'' |d'' :r'' |r'' :— |—|| :t |d'' :d'' |d'' :d'' |t :s |s :l |l :l |s :-.f |m :— |—|| f |m||","bass":":d |m :s |d'' :f |s :s |d :d |t_1 :m |r :r |s :— |—|| :s |s :m |d :r.d |t_1 :s_1 |d :t_1 |l_1 :f |m :m |l_1 :— |—|| :t_1 |d :s_1 |l_1 :t_1 |d :r |m :m |f :-.m |f :r |s :— |—|| :f |m :d |f :d |s_1 :l_1.t_1 |d :l |f :f |s :s_1 |d :— |—|| f_1 |d||"}', 'X:1
T:Petersham (CMD, EPC tune)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] d2f2a2d''2 | b2a3gf2 | f2e2a2b2 | b2a6 | a2a2f2d''2 | b2a3gf2 | f2b2bc''d''2 | c''2b6 | a2f3ed2 | e2f2g2a2 | a2b3ab2 | b2c''6 | a2d''3c''b2 | a2a3gf2 | f2g2g2e2 | e2d6 | d2d2
[V:2] d2f2a2d''2 | g2e2e2f2 | d2e2c2e3 | dc6a2 | a2f2f2gf | e2c2d2e2 | d2e2f3e | d6e2 | d2c2B2e2 | d2d2d2a2 | g3ag2g2 | g6e2 | a2f2g2f2 | e2ded2d2 | d2d2d2c2 | d6B2 | A2
[V:3] d2f2a2d''2 | d''2d''2c''2d''2 | a2a2a2a2 | ^g2a6 | a2a2f2a2 | g2a2a2a2 | ^a2b2b2b2 | ^a2d6 | e2a2g2f2 | a2a2a2a2 | d''2d''3d''d''2 | e''2e''6 | c''2d''2d''2d''2 | d''2c''2a2a2 | b2b2b2a3 | gf6g2 | f2
[V:4] d2f2a2d''2 | g2a2a2d2 | d2c2f2e2 | e2a6 | a2a2f2d2 | edc2A2d2 | c2B2g2f2 | f2B6 | c2d2A2B2 | c2d2e2f2 | f2g3fg2 | e2a6 | g2f2d2g2 | d2A2Bcd2 | b2g2g2a2 | A2d6 | G2d2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=beTjvg_DoIY&ab_channel=AndrewRemillard', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Petersham (CMD, EPC tune)
M:C
L:1/8
Q:1/4=76
K:D
d2f2a2d''2 | b2a3gf2
% PHRASE_BREAK
 | f2e2a2b2 | b2a6
% PHRASE_BREAK
 | a2a2f2d''2 | b2a3gf2
% PHRASE_BREAK
 | f2b2bc''d''2 | c''2b6 |
a2f3ed2 | e2f2g2a2 | a2b3ab2 | b2c''6 | a2d''3c''b2 | a2a3gf2 | f2g2g2e2 | e2d6 | d2d2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (127, 'reciyJbSuxktaINQh', 'Kathrine', 'CM', 'X:1
T:Kathrine
M:C
L:1/8
Q:1/4=76
K:C
g2c''3eee | gff2
% PHRASE_BREAK
f2d''3 |
babc''4
% PHRASE_BREAK
g2 | e''3d''c''gba | a2
% PHRASE_BREAK
c''2g3c'' | bd''c''4
', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :-.m :m.m |s .f:f :f |r'' :-.t :l.t |d'' :-|| :s |m'' :-.r'' :d''.s |t .,l:l :d'' |s :-.d'' :t.r'' |d'' :-||","alto":":m |m :-.d :d.d |m .,r:r :r |f :-.f :f.f |m :-|| :m |s :-.s :s.s |s .,f:f :re |m :-.m :r.f |m :-||","tenor":":d'' |s :-.s :s.s |s .,t:t :t |t :-.r'' :r''.r'' |d'' :-|| :d'' |d'' :-.t :d''.d'' |d'' .,d'':d'' :l |d'' :-.s :s.s |s :-||","bass":":d |d :-.d :d.d |s_1 .,s_1:s_1 :s_1 |s :-.s :s.s |d :-|| :d |d :-.r :m.m |f .,f:f :fe |s :-.s :s_1.s_1 |d :-||"}', 'X:1
T:Kathrine
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''3eee | gff2f2d''3 | babc''4g2 | e''3d''c''gba | a2c''2g3c'' | bd''c''4
[V:2] e2e3ccc | edd2d2f3 | fffe4e2 | g3ggggf | f2^d2e3e | dfe4
[V:3] c''2g3ggg | gbb2b2b3 | d''d''d''c''4c''2 | c''3bc''c''c''c'' | c''2a2c''3g | ggg4
[V:4] c2c3ccc | GGG2G2g3 | gggc4c2 | c3deeff | f2^f2g3g | GGc4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Kathrine
M:C
L:1/8
Q:1/4=76
K:C
g2c''3eee | gff2
% PHRASE_BREAK
f2d''3 |
babc''4
% PHRASE_BREAK
g2 | e''3d''c''gba | a2
% PHRASE_BREAK
c''2g3c'' | bd''c''4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (136, 'recn1IeqVNcLU3MAY', 'Clarkeville', '66 66 88', 'X:1
T:Clarkeville
M:C
L:1/8
Q:1/4=76
K:D
a2a3gf2 | g2a4b4 | a2gfe2fg | f6a2 | a3gf2g2 | a4b4 | a2gfe2fg | f6a2 | b3c''d''2c''b | a2gfe2a2 | a6b2 | a2f2e2g2 | f6', NULL, '{"doh":"D","time":"C","soprano":":s |s :-.f |m :f |s :- |l :- |s :f.m |r :m.f |m :- |- :s |s :-.f |m :f |s :- |l :- |s :f.m |r :m.f |m :- |- :s |l :-.t |d'' :t.l |s :f.m |r :s |s :- |- :l |s :m |r :f |m :- |-||","alto":":m |m :-.r |d :r |m :- |f :- |m :r.d |t_1 :d.r |d :- |- :m |m :-.r |d :r |m :- |f :- |m :r.d |t_1 :d.r |d :- |- :m |f :-.s |l :s.f |m :r.d |t_1 :r |m :r |d :f |m :d |t_1 :r |d :- |-||","tenor":":d'' |d'' :-.s |s :s |s :d'' |d'' :- |d'' :s |s :s |s :- |- :d'' |d'' :-.s |s :s |s :d'' |d'' :- |d'' :s |s :s |s :- |- :d'' |d'' :-.d'' |d'' :d'' |d'' :s |s :t |d'' :t |d'' :d'' |d'' :s |- :- |s :- |-||","bass":":d |d :-.d |d :d |d :- |f_1 :- |s_1 :s_1 |s_1 :s_1 |d :- |- :d |d :-.d |d :d |d :- |f_1 :- |s_1 :s_1 |s_1 :s_1 |d :- |- :d |f :-.f |f :f_1 |d :d |s_1 :s_1 |d :r |m :f |s :- |s_1 :- |d :- |-||"}', 'X:1
T:Clarkeville
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2a3gf2 | g2a4b4 | a2gfe2fg | f6a2 | a3gf2g2 | a4b4 | a2gfe2fg | f6a2 | b3c''d''2c''b | a2gfe2a2 | a6b2 | a2f2e2g2 | f6
[V:2] f2f3ed2 | e2f4g4 | f2edc2de | d6f2 | f3ed2e2 | f4g4 | f2edc2de | d6f2 | g3ab2ag | f2edc2e2 | f2e2d2g2 | f2d2c2e2 | d6
[V:3] d''2d''3aa2 | a2a2d''2d''4 | d''2a2a2a2 | a6d''2 | d''3aa2a2 | a2d''2d''4 | d''2a2a2a2 | a6d''2 | d''3d''d''2d''2 | d''2a2a2c''2 | d''2c''2d''2d''2 | d''2a6 | a6
[V:4] d2d3dd2 | d2d4G4 | A2A2A2A2 | d6d2 | d3dd2d2 | d4G4 | A2A2A2A2 | d6d2 | g3gg2G2 | d2d2A2A2 | d2e2f2g2 | a4A4 | d6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Clarkeville
M:C
L:1/8
Q:1/4=76
K:D
a2a3gf2 | g2a4b4 | a2gfe2fg | f6a2 | a3gf2g2 | a4b4 | a2gfe2fg | f6a2 | b3c''d''2c''b | a2gfe2a2 | a6b2 | a2f2e2g2 | f6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (111, 'recdP1Ny6KabLm7Jo', 'Ostend', 'CM', 'X:1
T:Ostend
M:C
L:1/8
Q:1/4=76
K:Eb
_g2e3=e_g2 | _g2a2_g2_g2
% PHRASE_BREAK
 | e2_d3e=e2 | _g2e6
% PHRASE_BREAK
 | _g2e3=e_g2 | _g2a2_g2_g2
% PHRASE_BREAK
 | e2_d3_de2 |
_d2=B6 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_d_d2 | =e2_e3=e_g2 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_de2 | _d2=B6', NULL, '{"doh":"Eb","time":"C","soprano":":s |m :-.f |s :s |l :s |s :m |r :-.m |f :s |m :- |- || :s |m :-.f |s :s |l :s |s :m |r :-.r |m :r |d :- |- || :s |d'' :-.s |s :d'' |d'' :-.l |l :l |s :-.r |r :f |m :-.f |s || :s |d'' :-.s |s :d'' |d'' :-.l |l :l |s :-.r |m :r |d :- |- ||","alto":":d |d :-.d |d :d |d :d |d :d |t_1 :-.d |r :t_1 |d :- |- || :d |d :-.d |d :d |d :d |d :d |d :-.d |t_1 :t_1 |d :- |- || :d |d :-.d |d :d |d :-.f |f :f |r :-.t_1 |t_1 :r |m :-.f |s || :d |d :-.d |d :d |d :-.f |f :f |r :-.t_1 |t_1 :t_1 |d :- |- ||","tenor":":m |d :-.r |m :m |f :m |m :s |s :-.s |s :s |s :- |- || :m |d :-.r |m :m |f :m |m :s |s :-.s |s :f |m :- |- || :m |m :-.m |m :m |l :-.d'' |d'' :d'' |t :-.s |s :s |d :-.r |m || :m |m :-.m |m :m |l :-.d'' |d'' :d'' |t :-.s |s :s |m :- |- ||","bass":":d |d :-.d |d :d |d :d |d :d |s_1 :-.s_1 |s_1 :s_1 |d :- |- || :d |d :-.d |d :d |d :d |d :d |s_1 :-.s_1 |s_1 :s_1 |d :- |- || :d |d :-.d |d :d |f :-.f |f :f |s :-.s |s :s |s_1 :- |- || :d |d :-.d |d :d |f :-.f |f :f |s :-.s |s :s_1 |d :- |- ||"}', 'X:1
T:Ostend
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2e3=e_g2 | _g2a2_g2_g2 | e2_d3e=e2 | _g2e6 | _g2e3=e_g2 | _g2a2_g2_g2 | e2_d3_de2 | _d2=B6 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_d_d2 | =e2_e3=e_g2 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_de2 | _d2=B6
[V:2] =B2=B3=B=B2 | =B2=B2=B2=B2 | =B2_B3=B_d2 | B2=B6 | =B2=B3=B=B2 | =B2=B2=B2=B2 | =B2=B3=B_B2 | B2=B6 | =B2=B3=B=B2 | =B2=B3=e=e2 | =e2_d3BB2 | _d2e3=e_g2 | =B2=B3=B=B2 | =B2=B3=e=e2 | =e2_d3BB2 | B2=B6
[V:3] e2=B3_de2 | e2=e2_e2=e2 | _g2_g3_g_g2 | _g2_g6 | e2=B3_de2 | e2=e2_e2=e2 | _g2_g3_g_g2 | =e2_e6 | e2e3ee2 | e2a3=b=b2 | =b2_b3_g_g2 | _g2=B3_de2 | e2e3ee2 | e2a3=b=b2 | =b2_b3_g_g2 | _g2e6
[V:4] =B2=B3=B=B2 | =B2=B2=B2=B2 | =B2_G3_G_G2 | _G2=B6 | =B2=B3=B=B2 | =B2=B2=B2=B2 | =B2_G3_G_G2 | _G2=B6 | =B2=B3=B=B2 | =B2=e3=e=e2 | =e2_g3_g_g2 | _g2_G6 | =B2=B3=B=B2 | =B2=e3=e=e2 | =e2_g3_g_g2 | _G2=B6', NULL, NULL, NULL, 'https://youtu.be/48H1SaT4Q8s?si=6md7Zpqzx4O_AlRr', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Ostend
M:C
L:1/8
Q:1/4=76
K:Eb
_g2e3=e_g2 | _g2a2_g2_g2
% PHRASE_BREAK
 | e2_d3e=e2 | _g2e6
% PHRASE_BREAK
 | _g2e3=e_g2 | _g2a2_g2_g2
% PHRASE_BREAK
 | e2_d3_de2 |
_d2=B6 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_d_d2 | =e2_e3=e_g2 | _g2=b3_g_g2 | =b2=b3aa2 | a2_g3_de2 | _d2=B6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (143, 'recppSw9YRVxu5zRB', 'Soldau', 'LM (long meter, 88 88)', 'X:1
T:Soldau
M:C
L:1/8
Q:1/4=76
K:G
g2a2a2g2 | e2d2e2g2
% PHRASE_BREAK
 | b2d''2e''2d''2 | b2g2e2g2
% PHRASE_BREAK
 |
b2b2a2b2 | g2a2a2b2
% PHRASE_BREAK
 | g2e2d2e3 | fg2g2g2g2 | g2
', NULL, '{"doh":"G","time":"C","soprano":":d | r :r | d :l_1 | s_1 :l_1 | d :m | s :l | s :m | d :l_1 | d || :m | m :r | m :d | r :r | m :d | l_1 :s_1 | l_1 :-.t_1 | d :d | d || d | d ||","alto":":s_1 | s_1 :s_1 | m_1 :f_1 | m_1 :f_1 | m_1 :d | t_1 :r | t_1 :s_1 | l_1 :l_1 | s_1 || :d | d :t_1 | d :d | d :t_1 | d :s_1 | f_1 :m_1 | f_1 :-.f_1 | s_1 :l_1 | s_1 || l_1 | s_1 ||","tenor":":m | r :t_1 | d :d | d :d | d :s | s :fe | s :d | m :f | m || :s | s :s | s :l | l :s | s :m | d :d | d :-.r | m :f | m || f | m ||","bass":":d | t_1 :s_1 | l_1 :f_1 | d_1 :f_1 | d_1 :d | m :r | s_1 :d | l_1 :f_1 | d_1 || :d | d :s_1 | d :l_1 | f_1 :s_1 | d_1 :d_1 | f_1 :d_1 | f_1 :-.r_1 | d_1 :f_1 | d_1 || f_1 | d_1 ||"}', 'X:1
T:Soldau
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2a2a2g2 | e2d2e2g2 | b2d''2e''2d''2 | b2g2e2g2 | b2b2a2b2 | g2a2a2b2 | g2e2d2e3 | fg2g2g2g2 | g2
[V:2] d2d2d2B2 | c2B2c2B2 | g2f2a2f2 | d2e2e2d2 | g2g2f2g2 | g2g2f2g2 | d2c2B2c3 | cd2e2d2e2 | d2
[V:3] b2a2f2g2 | g2g2g2g2 | d''2d''2^c''2d''2 | g2b2c''2b2 | d''2d''2d''2d''2 | e''2e''2d''2d''2 | b2g2g2g3 | ab2c''2b2c''2 | b2
[V:4] g2f2d2e2 | c2G2c2G2 | g2b2a2d2 | g2e2c2G2 | g2g2d2g2 | e2c2d2G2 | G2c2G2c3 | AG2c2G2c2 | G2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=7uRdozJN6tI&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Soldau
M:C
L:1/8
Q:1/4=76
K:G
g2a2a2g2 | e2d2e2g2
% PHRASE_BREAK
 | b2d''2e''2d''2 | b2g2e2g2
% PHRASE_BREAK
 |
b2b2a2b2 | g2a2a2b2
% PHRASE_BREAK
 | g2e2d2e3 | fg2g2g2g2 | g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (108, 'reccZgubeYhjKMjzC', 'Salzburg', 'CM', 'X:1
T:Salzburg
M:C
L:1/8
K:F
f2a4c''2 | c''2b2a2a4 | g2f4f2 | f2e2f2c''2 | b2a2a2g2 | f2f4d''2 | c''2a2f2f4 | d''2c''4f''2 | f''2d''2b2a2 | b2g2f4 | f2f2', NULL, '{"doh":"F","time":"C","soprano":":d |m :—:s |s :f :m |m :—:r |d :—:d |d :t_1 :d |s :f :m |m :r || :d |d :—:l |s :m :d |d :—:l |s :—:d'' |d'' :l :f |m :f :r |d :— || d |d ||","alto":":s_1 |d :—:d |t_1 :—:d |d :—:t_1 |d :—:l_1 |s_1 :—:s_1 |s_1 :r :d |d :t_1 || :s_1 |d :—:d |d :—:s_1 |d :—:d |d :—:d |d :—:d |d :t_1 :t_1 |d :— || l_1 |s_1 ||","tenor":":m |s :—:s |s :—:s |s :—:f |m :—:f |s :f :m |r :s :s |s :— || :m |f :—:f |m :s :m |f :—:f |m :—:s |l :f :l |s :r :f |m :— || f |m ||","bass":":d |d :—:m |r :—:d |s_1 :—:se_1 |l_1 :—:f |m :r :d |t_1 :—:d |s_1 :— || :d.ta_1 |l_1 :—:f_1 |d :—:d.ta_1 |l_1 :—:f_1 |d :—:m_1 |f_1 :—:f_1 |s_1 :—:s_1 |d :— || f_1 |d ||"}', 'X:1
T:Salzburg
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2a4c''2 | c''2b2a2a4 | g2f4f2 | f2e2f2c''2 | b2a2a2g2 | f2f4d''2 | c''2a2f2f4 | d''2c''4f''2 | f''2d''2b2a2 | b2g2f4 | f2f2
[V:2] c2f4f2 | e4f2f4 | e2f4d2 | c4c2c2 | g2f2f2e2 | c2f4f2 | f4c2f4 | f2f4f2 | f4f2f2 | e2e2f4 | d2c2
[V:3] a2c''4c''2 | c''4c''2c''4 | b2a4b2 | c''2b2a2g2 | c''2c''2c''4 | a2b4b2 | a2c''2a2b4 | b2a4c''2 | d''2b2d''2c''2 | g2b2a4 | b2a2
[V:4] f2f4a2 | g4f2c4 | _d2=d4b2 | a2g2f2e4 | f2c4f_e | d4B2f4 | f_ed4B2 | f4A2B4 | B2c4c2 | f4B2f2', NULL, NULL, NULL, 'https://youtu.be/J9GOxK0uQVE?si=dTgNaq_Wa4U6JoKr', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Salzburg
M:C
L:1/8
Q:1/4=76
K:F
f2a4c''2 | c''2b2a2a4 | g2
% PHRASE_BREAK
f4f2 | f2e2f2c''2
% PHRASE_BREAK
 | b2a2a2g2 |
f2f4d''2 | c''2
% PHRASE_BREAK
a2f2f4 | d''2c''4f''2 | f''2d''2b2a2 | b2g2f4 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (113, 'receGvaPFiwD4ihgx', 'Dennis', 'SM', 'X:1
T:Dennis
M:C
L:1/8
Q:1/4=76
K:G
b2b2g2b2 | a2f2
% PHRASE_BREAK
a2g4 | g2g2e2g2
% PHRASE_BREAK
 | g2d2g2f4 |
a2a2f2a2
% PHRASE_BREAK
 | g2b2d''2d''2 | a2c''2b2d''2 | e''2d''2b2c''2 | b2g2a2g4
', NULL, '{"doh":"G","time":"C","soprano":":m | m :d :m | r :t_1 :r | d :— :d | d :l_1 :d | d :s_1 :d | t_1 :— || :r | r :t_1 :r | d :m :s | s :r :f | m :s :l | s :m :f | m :d :r | d :—||","alto":":s_1 | s_1 :— :s_1 | s_1 :— :s_1 | s_1 :— :s_1 | l_1 :— :l_1 | s_1 :— :s_1 | s_1 :— || :s_1 | s_1 :— :s_1 | s_1 :— :d | t_1 :— :r | d :— :d | d :— :d | d :— :s_1 | s_1 :—||","tenor":":m | m :— :m | f :— :f | m :— :d | d :— :f | m :— :m | r :— || :t_1 | t_1 :r :f | m :— :m | r :— :s | s :m :f | m :s :l | s :m :f | m :—||","bass":":d | d :— :d | s_1 :— :s_1 | d :— :m_1 | f_1 :— :f_1 | d :— :d | s :— || :s_1 | s_1 :— :s_1 | d :— :d | s_1 :— :t_1 | d :— :f_1 | d :— :f_1 | s_1 :— :s_1 | d_1 :—||"}', 'X:1
T:Dennis
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] b2b2g2b2 | a2f2a2g4 | g2g2e2g2 | g2d2g2f4 | a2a2f2a2 | g2b2d''2d''2 | a2c''2b2d''2 | e''2d''2b2c''2 | b2g2a2g4
[V:2] d2d4d2 | d4d2d4 | d2e4e2 | d4d2d4 | d2d4d2 | d4g2f4 | a2g4g2 | g4g2g4 | d2d4
[V:3] b2b4b2 | c''4c''2b4 | g2g4c''2 | b4b2a4 | f2f2a2c''2 | b4b2a4 | d''2d''2b2c''2 | b2d''2e''2d''2 | b2c''2b4
[V:4] g2g4g2 | d4d2g4 | B2c4c2 | g4g2d''4 | d2d4d2 | g4g2d4 | f2g4c2 | g4c2d4 | d2G4', NULL, NULL, NULL, 'https://youtu.be/BXp2XkKczTc?si=9SE3owy1ZSXZtkn-', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Dennis
M:C
L:1/8
Q:1/4=76
K:G
b2b2g2b2 | a2f2
% PHRASE_BREAK
a2g4 | g2g2e2g2
% PHRASE_BREAK
 | g2d2g2f4 |
a2a2f2a2
% PHRASE_BREAK
 | g2b2d''2d''2 | a2c''2b2d''2 | e''2d''2b2c''2 | b2g2a2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (129, 'recjwcEkqD6f5ykGQ', 'Dunfermline', 'CM', 'X:1
T:Dunfermline
M:C
L:1/8
Q:1/4=76
K:G
g2g2a2b2 | c''2d''2d''2b2
% PHRASE_BREAK
 | b2e''2d''2d''2 | ^c''2d''6
% PHRASE_BREAK
 |
d''2b2d''2e''2 | d''2c''2b2a2
% PHRASE_BREAK
 | b2a2g2g2 | f2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":d | d :r | m :f | s :s | m :m | l :s | s :fe | s :— | — || :s | m :s | l :s | f :m | r :m | r :d | d :t_1 | d :— | — || d | d ||","alto":":s_1 | s_1 :s_1 | s_1 :d | d :t_1 | d :d | d :d | t_1 :l_1 | t_1 :— | — || :t_1 | d :d | d :d | t_1 :d | t_1 :d | t_1 :l_1 | l_1 :s_1 | s_1 :— | — || l_1 | s_1 ||","tenor":":m | m :r | d :d | r :r | m :s | f :m | r :r | r :— | — || :s | s :m | f :s | s :s | s :s | s.f :m | f.m :r | m :— | — || f | m ||","bass":":d | d :t_1 | d :l_1 | s_1 :s_1 | d :d | f_1 :d | r :r_1 | s_1 :— | — || :s_1 | d :d | f :m | r :d | s_1 :d | s_1 :l_1 | f_1 :s_1 | d_1 :— | — || f_1 | d_1 ||"}', 'X:1
T:Dunfermline
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2g2a2b2 | c''2d''2d''2b2 | b2e''2d''2d''2 | ^c''2d''6 | d''2b2d''2e''2 | d''2c''2b2a2 | b2a2g2g2 | f2g6 | g2g2
[V:2] d2d2d2d2 | g2g2f2g2 | g2g2g2f2 | e2f6 | f2g2g2g2 | g2f2g2f2 | g2f2e2e2 | d2d6 | e2d2
[V:3] b2b2a2g2 | g2a2a2b2 | d''2c''2b2a2 | a2a6 | d''2d''2b2c''2 | d''2d''2d''2d''2 | d''2d''c''b2c''b | a2b6 | c''2b2
[V:4] g2g2f2g2 | e2d2d2g2 | g2c2g2a2 | A2d6 | d2g2g2c''2 | b2a2g2d2 | g2d2e2c2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/d00qQr_HMR4?si=863j55Y92uGun3mE', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Dunfermline
M:C
L:1/8
Q:1/4=76
K:G
g2g2a2b2 | c''2d''2d''2b2
% PHRASE_BREAK
 | b2e''2d''2d''2 | ^c''2d''6
% PHRASE_BREAK
 |
d''2b2d''2e''2 | d''2c''2b2a2
% PHRASE_BREAK
 | b2a2g2g2 | f2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (167, 'recyDNRrx0LATLZbf', 'Rimington', 'LM (long meter, 88 88)', 'X:1
T:Rimington
M:C
L:1/8
K:F
a2gfc''ag2 | g2f2
% PHRASE_BREAK
a2ad'' | c''af2b2g4
% PHRASE_BREAK
 | g2gba3a | aff
% PHRASE_BREAK
bg3g | c''2b2a3g | f2e2f2', NULL, '[object Object]', 'X:1
T:Rimington
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] a2gfc''ag2 | g2f2a2ad'' | c''af2b2g4
[V:2] f2efgff2 | e2f2f2ff | ffd2f2e4
[V:3] c''2bagc''d''2 | c''ba2c''2c''b | c''c''b2d''2c''4
[V:4] f2cdefB2 | c2f2f2fb | afb2g2c4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Rimington
M:C
L:1/8
K:F
a2gfc''ag2 | g2f2
% PHRASE_BREAK
a2ad'' | c''af2b2g4
% PHRASE_BREAK
 | g2gba3a | aff
% PHRASE_BREAK
bg3g | c''2b2a3g | f2e2f2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (121, 'recgqTUlDzpBlbwQI', 'Consolation', 'CM', 'X:1
T:Consolation
M:C
L:1/8
Q:1/4=76
K:G
d2g2g2g2 | g2b2a2g2
% PHRASE_BREAK
 | d2a2a2c''2 | b2a6
% PHRASE_BREAK
 |
d2b2b2b2 | b2c''2d''2e''2
% PHRASE_BREAK
 | c''ag2g2b2 | a2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":s_1 |d :d |d :d |m :r |d :s_1 |r :r |f :m |r :— |— || :s_1 |m :m |m :m |f :s |l :f.r |d :d |m :r |d :— |— || d | d ||","alto":":m_1 |m_1 :f_1 |s_1 :l_1 |s_1 :f_1 |m_1 :s_1 |s_1 :t_1 |t_1 :d |t_1 :— |— || :s_1 |s_1 :se_1 |l_1 :s_1 |f_1 :d |d :l_1 |s_1 :s_1 |t_1 :t_1 |s_1 :— |— || l_1 | s_1 ||","tenor":":d |d :d |d :d |d :t_1 |d :m |r :s |s :s |s :— |— || :r |m :r |d :d |d :m |f :f |m :m |s :f |m :— |— || f | m ||","bass":":d_1 |d_1 :r_1 |m_1 :f_1 |s_1 :s_1 |d_1 :d |t_1 :s_1 |r :d |s_1 :— |— || :t_1 |d :t_1 |l_1 :ta_1 |l_1 :s_1 |f_1 :f_1 |s_1 :s_1 |s_1 :s_1 |d_1 :— |— || f_1 | d_1 ||"}', 'X:1
T:Consolation
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2g2g2g2 | g2b2a2g2 | d2a2a2c''2 | b2a6 | d2b2b2b2 | b2c''2d''2e''2 | c''ag2g2b2 | a2g6 | g2g2
[V:2] B2B2c2d2 | e2d2c2B2 | d2d2f2f2 | g2f6 | d2d2^d2e2 | d2c2g2g2 | e2d2d2f2 | f2d6 | e2d2
[V:3] g2g2g2g2 | g2g2f2g2 | b2a2d''2d''2 | d''2d''6 | a2b2a2g2 | g2g2b2c''2 | c''2b2b2d''2 | c''2b6 | c''2b2
[V:4] G2G2A2B2 | c2d2d2G2 | g2f2d2a2 | g2d6 | f2g2f2e2 | =f2e2d2c2 | c2d2d2d2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=rgnxyuVNZdk&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Consolation
M:C
L:1/8
Q:1/4=76
K:G
d2g2g2g2 | g2b2a2g2
% PHRASE_BREAK
 | d2a2a2c''2 | b2a6
% PHRASE_BREAK
 |
d2b2b2b2 | b2c''2d''2e''2
% PHRASE_BREAK
 | c''ag2g2b2 | a2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (157, 'recuSJwj831gWgdNI', 'Winchester', 'CM', 'X:1
T:Winchester
M:C
L:1/8
Q:1/4=76
K:G
g2b3ba2 | g2c''2c''2b2
% PHRASE_BREAK
 | a2b2d''2d''2 | ^c''2d''6
% PHRASE_BREAK
 |
b2e''3d''c''2 | b2a2g2f2
% PHRASE_BREAK
 | b2a2g2g2 | f2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":d |m :-.m|r :d |f :f |m :r |m :s |s :fe |s :—|—|| :m |l :-.s|f :m |r :d |t_1 :m |r :d |d :t_1 |d :—|—||d |d||","alto":":s_1 |s_1 :-.s_1|s_1 :m_1 |l_1 :l_1 |s_1 :t_1 |d :t_1 |r :-.d|t_1 :—|—|| :d |d :-.d|d :d |l_1 :m_1.f_1|s_1 :s_1 |s_1 :m_1.f_1|s_1 :-.f_1|m_1 :—|—||f_1 |m_1||","tenor":":m |d :-.d|t_1 :d |d :d |d :s |s :s |l :l |s :—|—|| :s |f :-.m|f :s |f :d |r :d |t_1 :d |r :r |d :—|—||l_1 |s_1||","bass":":d |d :-.d|s_1 :l_1 |f_1 :f_1 |d :s_1 |d :m |r :r |s_1 :—|—|| :d |f :-.d|l_1 :d |f_1 :l_1 |s_1 :d |s_1 :l_1 |s_1 :s_1 |d_1 :—|—||f_1 |d_1||"}', 'X:1
T:Winchester
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2b3ba2 | g2c''2c''2b2 | a2b2d''2d''2 | ^c''2d''6 | b2e''3d''c''2 | b2a2g2f2 | b2a2g2g2 | f2g6 | g2g2
[V:2] d2d3dd2 | B2e2e2d2 | f2g2f2a3 | gf6g2 | g3gg2g2 | e2Bcd2d2 | d2Bcd3c | B6c2 | B2
[V:3] b2g3gf2 | g2g2g2g2 | d''2d''2d''2e''2 | e''2d''6 | d''2c''3bc''2 | d''2c''2g2a2 | g2f2g2a2 | a2g6 | e2d2
[V:4] g2g3gd2 | e2c2c2g2 | d2g2b2a2 | a2d6 | g2c''3ge2 | g2c2e2d2 | g2d2e2d2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://youtu.be/D5i3g2NN2jw?si=5pveZAqXoxS861em', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Winchester
M:C
L:1/8
Q:1/4=76
K:G
g2b3ba2 | g2c''2c''2b2
% PHRASE_BREAK
 | a2b2d''2d''2 | ^c''2d''6
% PHRASE_BREAK
 |
b2e''3d''c''2 | b2a2g2f2
% PHRASE_BREAK
 | b2a2g2g2 | f2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (124, 'reciFl9xBIdfCTbEL', 'Boston', 'CM', 'X:1
T:Boston
M:C
L:1/8
Q:1/4=76
K:Ab
c2c2=B2c4 | A2E4F2 | E4
% PHRASE_BREAK
E2F4 | A2c4BA
% PHRASE_BREAK
 |
B6c2 | c2A2E4 | c2e4e2
% PHRASE_BREAK
 | d4B2A2 | G2A2c4 | B2A6
', NULL, '{"doh":"Ab","time":"C","soprano":"m :m :re | m :- :d | s_1 :- :l_1 | s_1 :- :s_1 | l_1 :- :d | m :- :r.d | r :- :- || m :m :d | s_1 :- :m | s :- :s | f :- :r | d :t_1 :d | m :- :r | d :- :-||","alto":"s_1 :s_1 :fe_1 | s_1 :- :m_1 | m_1 :- :re_1 | m_1 :- :s_1 | f_1 :- :s_1 | fe_1 :- :fe_1 | s_1 :- :- || s_1 :s_1 :m_1 | m_1 :- :s_1 | ta_1 :- :ta_1 | l_1 :- :l_1 | s_1 :- :s_1 | s_1 :d :t_1 | s_1 :- :-||","tenor":"d :d :d | d :- :s_1 | s_1 :- :fe_1 | s_1 :- :d | d :- :d | d :- :d | t_1 :- :- || d :d :s_1 | d :- :d | d :- :de | r :- :f | m :r :m | s_1 :d :t_1 | s_1 :- :-||","bass":"d_1 :d_1 :d_1 | d_1 :- :d_1 | d_1 :- :d_1 | d_1 :- :m_1 | f_1 :- :m_1 | r_1 :- :l_1 | s_1 :- :- || d_1 :d_1 :d_1 | d_1 :- :d_1 | m_1 :- :m_1 | f_1 :- :f_1 | s_1 :- :s_1 | s_1 :- :f | m :- :-||"}', 'X:1
T:Boston
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] c2c2=B2c4 | A2E4F2 | E4E2F4 | A2c4BA | B6c2 | c2A2E4 | c2e4e2 | d4B2A2 | G2A2c4 | B2A6
[V:2] E2E2=D2E4 | C2C4=B,2 | C4E2D4 | E2=D4=D2 | E6E2 | E2C2C4 | E2_G4_G2 | F4F2E4 | E2E2A2G2 | E6
[V:3] A2A2A2A4 | E2E4=D2 | E4A2A4 | A2A4A2 | G6A2 | A2E2A4 | A2A4=A2 | B4d2c2 | B2c2E2A2 | G2E6
[V:4] A,2A,2A,2A,4 | A,2A,4A,2 | A,4C2D4 | C2B,4F2 | E6A,2 | A,2A,2A,4 | A,2C4C2 | D4D2E4 | E2E4d2 | c6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Boston
M:C
L:1/8
Q:1/4=76
K:Ab
c2c2=B2c4 | A2E4F2 | E4
% PHRASE_BREAK
E2F4 | A2c4BA
% PHRASE_BREAK
 |
B6c2 | c2A2E4 | c2e4e2
% PHRASE_BREAK
 | d4B2A2 | G2A2c4 | B2A6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (49, 'recJ9l2EaOrKle1xI', 'French', 'CM', 'X:1
T:French
C:Scottish Psalter 1564
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | c B A2
% PHRASE_BREAK
 | G A B G | A3 :|
| D
% PHRASE_BREAK
 | B c d B | c d e2 | d
% PHRASE_BREAK
 B c A | B3 :|
| B | c d e d | c B A2 | B c d B | c3 :|
| c | d d c B | A G F#2 | G A B G | G3 :|
', NULL, '{"doh":"F","time":"C","soprano":":d |m :f |s :d |r :m |f :m |r :d |d :t_1 |d :— |—|| :s |d'' :t |l :s |s :fe |s :m |r :d |d :t_1 |d :— |—|| d |d ||","alto":":s_1 |d :d |d :l_1 |t_1 :d |d :d |t_1 :l_1 |l_1 :s_1 |s_1 :— |—|| :d |m :r |r :t_1 |m :r |t_1 :d |t_1 :l_1 |l_1 :s_1 |s_1 :— |—|| l_1 |s_1 ||","tenor":":m |s :l |s :m |s :s |l :s |s :m |f :r |m :— |—|| :m |s :s |fe :s |l :l |s :s |s :m |f :r |m :— |—|| f |m ||","bass":":d |d :f_1 |m_1 :l_1 |s_1 :d |f_1 :d |s_1 :l_1 |f_1 :s_1 |d :— |—|| :d |d :s_1 |r :m |d :r |s_1 :d |s_1 :l_1 |f_1 :s_1 |d :— |—|| f_1 |d_1 ||"}', 'X:1
T:French
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2a2b2c''2 | f2g2a2b2 | a2g2f2f2 | e2f6 | c''2f''2e''2d''2 | c''2c''2=b2c''2 | a2g2f2f2 | e2f6 | f2f2
[V:2] c2f2f2f2 | d2e2f2f2 | f2e2d2d2 | c2c6 | f2a2g2g2 | e2a2g2e2 | f2e2d2d2 | c2c6 | d2c2
[V:3] a2c''2d''2c''2 | a2c''2c''2d''2 | c''2c''2a2b2 | g2a6 | a2c''2c''2=b2 | c''2d''2d''2c''2 | c''2c''2a2b2 | g2a6 | b2a2
[V:4] f2f2B2A2 | d2c2f2B2 | f2c2d2B2 | c2f6 | f2f2c2g2 | a2f2g2c2 | f2c2d2B2 | c2f6 | B2F2', NULL, NULL, NULL, 'https://hymnary.org/media/fetch/179668', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:French
C:Scottish Psalter 1564
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | c B A2
% PHRASE_BREAK
 | G A B G | A3 :|
| D
% PHRASE_BREAK
 | B c d B | c d e2 | d
% PHRASE_BREAK
 B c A | B3 :|
| B | c d e d | c B A2 | B c d B | c3 :|
| c | d d c B | A G F#2 | G A B G | G3 :|
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (132, 'recm1AS742tawg200', 'Perfect Way', 'CM', 'X:1
T:Perfect Way
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2B2d2 | B2G2G2B2
% PHRASE_BREAK
 | G2F2B2d2 | cB
% PHRASE_BREAK
c6 | F2B2B2d2 | B2G2G2
% PHRASE_BREAK
B2 | G2F2B2A2 |
c2B6 | B2c2c2c2 | dcB2B2B2 | d2c2d2e2 | dcB4A2 | F2B2B2dc | BAG2G2cd | ecB2B2A2 | A2B6', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |d :d |m :d |l_1 :l_1 |d :l_1 |s_1 :d |m :r.d |r :- |- || :s_1 |d :d |m :d |l_1 :l_1 |d :l_1 |s_1 :d |t_1 :r |d :- |- || :d |r :r |r :m.r |d :d |d :m |r :m |f :m.r |d :- |t_1 || :s_1 |d :d |m.r :d.t_1 |l_1 :l_1 |r.m :f.r |d :d |t_1 :t_1 |d :- |- ||","alto":":s_1 |m_1 :m_1 |s_1 :m_1 |f_1 :f_1 |l_1 :f_1 |m_1 :m_1 |s_1 :fe_1 |s_1 :- |- || :s_1 |m_1 :m_1 |s_1 :m_1 |f_1 :f_1 |l_1 :f_1 |m_1 :s_1 |s_1 :s_1 |m_1 :- |- || :m_1 |s_1 :s_1 |s_1 :s_1.f_1 |m_1 :f_1 |m_1 :s_1 |l_1 :l_1 |l_1 :l_1 |s_1 :- |- || :s_1 |m_1 :m_1 |s_1.f_1 :m_1.s_1 |f_1 :f_1 |l_1 :l_1 |s_1 :s_1 |f_1 :f_1 |m_1 :- |- ||","tenor":":s_1 |s_1 :s_1 |d :d |d :d |d :d |d :d |d :r |t_1 :- |- || :s_1 |s_1 :s_1 |d :d |d :d |d :d |d :m |r :f |m :- |- || :d |t_1 :t_1 |t_1 :t_1 |d :l_1 |s_1 :d |r :de |r :de.r |m :- |r || :s_1 |s_1 :s_1 |d :d |d :d |d :d |m :m |r :r |d :- |- ||","bass":":s_1 |d_1 :d_1 |d_1 :d_1 |f_1 :f_1 |f_1 :f_1 |d_1 :d_1 |d :l_1 |s_1 :- |- || :s_1 |d_1 :d_1 |d_1 :d_1 |f_1 :f_1 |f_1 :f_1 |s_1 :s_1 |s_1 :s_1 |d_1 :- |- || :d_1 |s_1 :s_1 |s_1 :s_1 |d_1 :d_1 |d_1 :d_1 |f_1 :m_1 |r_1 :m_1.f_1 |s_1 :- |- || :s_1 |d_1 :d_1 |d_1 :d_1 |f_1 :f_1 |f_1 :f_1 |s_1 :s_1 |s_1 :s_1 |d_1 :- |- ||"}', 'X:1
T:Perfect Way
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2B2B2d2 | B2G2G2B2 | G2F2B2d2 | cBc6 | F2B2B2d2 | B2G2G2B2 | G2F2B2A2 | c2B6 | B2c2c2c2 | dcB2B2B2 | d2c2d2e2 | dcB4A2 | F2B2B2dc | BAG2G2cd | ecB2B2A2 | A2B6
[V:2] F2D2D2F2 | D2E2E2G2 | E2D2D2F2 | =E2F6 | F2D2D2F2 | D2E2E2G2 | E2D2F2F2 | F2D6 | D2F2F2F2 | FED2E2D2 | F2G2G2G2 | G2F6 | F2D2D2FE | DFE2E2G2 | G2F2F2E2 | E2D6
[V:3] F2F2F2B2 | B2B2B2B2 | B2B2B2B2 | c2A6 | F2F2F2B2 | B2B2B2B2 | B2B2d2c2 | e2d6 | B2A2A2A2 | A2B2G2F2 | B2c2=B2c2 | =Bcd4c2 | F2F2F2B2 | B2B2B2B2 | B2d2d2c2 | c2B6
[V:4] F2B,2B,2B,2 | B,2E2E2E2 | E2B,2B,2B2 | G2F6 | F2B,2B,2B,2 | B,2E2E2E2 | E2F2F2F2 | F2B,6 | B,2F2F2F2 | F2B,2B,2B,2 | B,2E2D2C2 | DEF6 | F2B,2B,2B,2 | B,2E2E2E2 | E2F2F2F2 | F2B,6', NULL, NULL, NULL, 'https://soundcloud.com/connorq/psalm-34-tune-perfect-way-1', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Perfect Way
M:C
L:1/8
Q:1/4=76
K:Bb
F2B2B2d2 | B2G2G2B2
% PHRASE_BREAK
 | G2F2B2d2 | cB
% PHRASE_BREAK
c6 | F2B2B2d2 | B2G2G2
% PHRASE_BREAK
B2 | G2F2B2A2 |
c2B6 | B2c2c2c2 | dcB2B2B2 | d2c2d2e2 | dcB4A2 | F2B2B2dc | BAG2G2cd | ecB2B2A2 | A2B6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (140, 'recp5tMuB5o5tuH6H', 'Argyle', 'CM', 'X:1
T:Argyle
M:C
L:1/8
Q:1/4=76
K:G
d2b2a2g2 | e4d2d2 | b2 a2 g4
w: Yet God _ is good to is- _ rae- l,
% PHRASE_BREAK
| g2g2b2d''2 d''2 b2 g2 a4
w: to each _ pure- -hear- _ ted one.
% PHRASE_BREAK
| g2b2d''2e''2 d''2 b2 d''2 e''4 d''2 b4
w: But as _ for me, _ my steps near slipp''d,
% PHRASE_BREAK
| ba | g2e2d2d2 | b2a2g4
w: my _ feet _ were al- _ most gone.', NULL, '{"doh":"G","time":"C","soprano":":s_1 | m :r :d | l_1 :— :s_1 | s_1 :m :r | d :— :d | d :m :s | s :m :d | r :— || :d | m :s :l | s :m :s | l :— :s | m :— :m.r | d :l_1 :s_1 | s_1 :m :r | d :—||","alto":":m_1 | s_1 :— :s_1 | f_1 :— :s_1 | s_1 :— :s_1.f_1 | m_1 :— :m_1 | m_1 :s_1 :s_1 | s_1 :— :s_1.d | t_1 :— || : | : : | : : | : : | : :s_1 | s_1 :f_1 :s_1 | s_1 :— :f_1 | m :—||","tenor":":d | d :t_1 :d | d :— :t_1 | d :— :t_1 | d :— :d | d :— :m | r :d :m | r :— || :m | d :m :f | m :d :m | f :— :m | d :— :d.r | m :d :t_1 | d :— :t_1 | d :—||","bass":":d_1 | d_1 :r_1 :m_1 | f_1 :— :f_1 | m_1 :d_1 :s_1 | d :— :d_1 | d_1 :— :d | t_1 :d :d_1 | s_1 :— || : | : : | : : | : : | : :d.t_1 | d :f_1 :f_1 | m_1 :d_1 :s_1 | d :—||"}', 'X:1
T:Argyle
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2b2a2g2 | e4d2d2 | b2a2g4 | g2g2b2d''2 | d''2b2g2a4 | g2b2d''2e''2 | d''2b2d''2e''4 | d''2b4ba | g2e2d2d2 | b2a2g4
[V:2] B2d4d2 | c4d2d4 | dcB4B2 | B2d2d2d4 | dgf4d2 | d2c2d2d4 | c2b4
[V:3] g2g2f2g2 | g4f2g4 | f2g4g2 | g4b2a2 | g2b2a4 | b2g2b2c''2 | b2g2b2c''4 | b2g4ga | b2g2f2g4 | f2g4
[V:4] G2G2A2B2 | c4c2B2 | G2d2g4 | G2G4g2 | f2g2G2d4 | gfg2c2c2 | B2G2d2g4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=GGuNn3SHoa0', 'sole start', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Argyle
M:C
L:1/8
Q:1/4=76
K:G
d2b2a2g2 | e4d2d2 | b2
% PHRASE_BREAK
a2g4 | g2g2b2d''2
% PHRASE_BREAK
 |
d''2b2g2a4 | g2b2d''2e''2
% PHRASE_BREAK
 | d''2b2d''2e''4 | d''2b4ba | g2e2d2d2 | b2a2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (133, 'recmZgPAIIVSY3500', 'Rest', 'CM', 'X:1
T:Rest
M:C
L:1/8
Q:1/4=76
K:Bb
F2F2B2A2 | c2B2F2F2
% PHRASE_BREAK
 | F2G2G2B2 |
G2F6
% PHRASE_BREAK
 | F2d2c2B2 | A2G2G2c2
% PHRASE_BREAK
 | A2B2Bcd2 | c2B6
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |s_1 :d |t_1 :r |d :s_1 |s_1 :s_1 |l_1 :l_1 |d :l_1 |s_1 :— |— || :s_1 |m :r |d :t_1 |l_1 :l_1 |r :t_1 |d :d.r |m :r |d :— |— || d | d","alto":":m_1 |m_1 :s_1 |s_1 :s_1 |s_1 :f_1 |m_1 :s_1 |s_1 :f_1 |f_1 :f_1 |s_1 :— |— || :f_1 |m_1 :f_1 |s_1 :s_1 |l_1 :s_1 |f_1 :f_1 |m_1 :l_1 |s_1 :f_1 |m_1 :— |— || f_1 | m_1","tenor":":d |d :d |r :t_1 |d :t_1 |d :d |d :d |d :d |d :— |— || :t_1 |d :t_1 |d :d |d :de |r :r |d :d |d :t_1 |d :— |— || l_1 | s_1","bass":":d_1 |d_1 :m_1 |s_1 :f_1 |m_1 :r_1 |d_1 :m_1 |f_1 :f_1 |l_1 :f_1 |m_1 :— |— || :r_1 |d_1 :r_1 |m_1 :m_1 |f_1 :m_1 |r_1 :s_1 |l_1 :f_1 |s_1 :s_1 |d_1 :— |— || f_1 | d_1"}', 'X:1
T:Rest
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2F2B2A2 | c2B2F2F2 | F2G2G2B2 | G2F6 | F2d2c2B2 | A2G2G2c2 | A2B2Bcd2 | c2B6
[V:2] D2D2F2F2 | F2F2E2D2 | F2F2E2E2 | E2F6 | E2D2E2F2 | F2G2F2E2 | E2D2G2F2 | E2D6
[V:3] B2B2B2c2 | A2B2A2B2 | B2B2B2B2 | B2B6 | A2B2A2B2 | B2B2=B2c2 | c2B2B2B2 | A2B6
[V:4] B,2B,2D2F2 | E2D2C2B,2 | D2E2E2G2 | E2D6 | C2B,2C2D2 | D2E2D2C2 | F2G2E2F2 | F2B,6', NULL, NULL, NULL, 'https://youtu.be/X30zkyfFQI4?si=7DseHdVjUNA6iFeL', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Rest
M:C
L:1/8
Q:1/4=76
K:Bb
F2F2B2A2 | c2B2F2F2
% PHRASE_BREAK
 | F2G2G2B2 |
G2F6
% PHRASE_BREAK
 | F2d2c2B2 | A2G2G2c2
% PHRASE_BREAK
 | A2B2Bcd2 | c2B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (141, 'recp6Ve5hZMhV4DoE', 'New Britain', 'CM', 'X:1
T:New Britain
M:C
L:1/8
Q:1/4=76
K:G
d2g4bg | b4a2g4 | e2
% PHRASE_BREAK
d4d2 | g4bgb4
% PHRASE_BREAK
 |
a2d''4b2 | d''3bd''bg4
% PHRASE_BREAK
 | d2e2z2ge | d4d2g4 | bgb4a2 | g4
', NULL, '{"doh":"G","time":"C","soprano":":s_1 | d :-:m.d | m :-:r | d :-:l_1 | s_1 :-:s_1 | d :-:m.d | m :-:r | s :- || :m | s :-.m:s.m | d :-:s_1 | l_1 :-d:d.l_1 | s_1 :-:s_1 | d :-:m.d | m :-:r | d :- ||","alto":":m_1 | m_1 :-:s_1 | s_1 :-:f_1 | m_1 :-:f_1 | m_1 :-:m_1 | m_1 :-:s_1 | s_1 :-:s_1 | s_1 :- || :s_1 | s_1 :- :s_1 | s_1 :-:s_1 | f_1 :-.s_1:f_1 | m_1 :-:s_1 | m_1 :-:s_1 | s_1 :-:f_1 | m_1 :- ||","tenor":":d | s_1 :-:d | d :-:t_1 | d :-:d | d :- :d | s_1 :-:d | d :-:t_1 | d :- || :d | m :-.d:m.d | d :-:d | d :- :l_1.d | d :-:d | d :-:d.m | d :-:t_1 | d :- ||","bass":":d_1 | d_1 :-:d_1.m_1 | s_1 :-:s_1 | l_1 :-:f_1 | d_1 :- :d_1 | d_1 :-:d_1.m_1 | s_1 :-:f_1 | m_1 :- || :d_1 | d :- :d | m_1 :-:m_1 | f_1 :-.m_1:f | d_1 :-:m_1 | l_1 :-:s_1 | s_1 :-:s_1 | d_1 :- ||"}', 'X:1
T:New Britain
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2g4bg | b4a2g4 | e2d4d2 | g4bgb4 | a2d''4b2 | d''3bd''bg4 | d2e2z2ge | d4d2g4 | bgb4a2 | g4
[V:2] B2B4d2 | d4c2B4 | c2B4B2 | B4d2d4 | d2d4d2 | d4d2d4 | d2c3dc2 | B4d2B4 | d2d4c2 | B4
[V:3] g2d4g2 | g4f2g4 | g2g4g2 | d4g2g4 | f2g4g2 | b3gbgg4 | g2g4eg | g4g2g4 | gbg4f2 | g4
[V:4] G2G4GB | d4d2e4 | c2G4G2 | G4GBd4 | c2B4G2 | g4g2B4 | B2c3Bc''2 | G4B2e4 | d2d4d2 | G4', NULL, NULL, NULL, 'https://youtu.be/9XmgORFlH6A?si=iFIaBm703s_X7hW1', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:New Britain
M:C
L:1/8
Q:1/4=76
K:G
d2g4bg | b4a2g4 | e2
% PHRASE_BREAK
d4d2 | g4bgb4
% PHRASE_BREAK
 |
a2d''4b2 | d''3bd''bg4
% PHRASE_BREAK
 | d2e2z2ge | d4d2g4 | bgb4a2 | g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (144, 'recqWyWtuk32oDfnu', 'Dunlapscreek', 'CM', 'X:1
T:Dunlapscreek
M:C
L:1/8
K:Eb
=B2e_ge2_d=B | A=B=B2_g2=b_b | a2_ge_g4 | _g2=b_ba2_g2 | A_ge_d=B2=B_d | e_ge2_d2=B4', NULL, '{"doh":"Eb","time":"C","soprano":":d | m.s :m :r.d | l_1.d :d :s | d''.t :l :s.m | s :- || :s | d''.t :l :s | l_1,s.m,r:d :d.r | m.s :m :r | d :-||","alto":":s_1 | s_1.s_1 :s_1 :s_1 | f_1.l_1 :s_1 :d | d.d :d :d | t_1 :- || :d | d.d :d :d | d .d :d :d | d.d :d :t_1 | d :-||","tenor":":m | m.r :d :d | d.f :m :m | m.m :f :s | s :- || :m | s.s :f :m | f,m.s,f:m :m.f | s.m :d.m :s.f | m :-||","bass":":d | d.t_1 :d :m_1 | f_1.f_1 :d :d | d.d :f :m.d | s_1 :- || :d | m.m :f :d | d .d :d :l_1 | s_1.s_1 s_1 s_1 | d :-||"}', 'X:1
T:Dunlapscreek
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e_ge2_d=B | A=B=B2_g2=b_b | a2_ge_g4 | _g2=b_ba2_g2 | zz=B2=B_de_g | e2_d2=B4
[V:2] _G2_G_G_G2_G2 | =EA_G2=B2=B=B | =B2=B2_B4 | =B2=B=B=B2=B2 | =B=B=B2=B2=B=B | =B2_B2=B4
[V:3] e2e_d=B2=B2 | =B=e_e2=e2_e=e | =e2_g2_g4 | e2_g_g=e2_e2 | zze2e=e_g_e | =Be_g=e_e4
[V:4] =B2=B_B=B2E2 | =E=E=B2=B2=B=B | =e2_e=B_G4 | =B2ee=e2=B2 | =B=B=B2A2_Gz | =B4', NULL, NULL, NULL, 'https://youtu.be/xj1y1NemKfs?si=bY6p242Kxi1T1RA0', NULL, 'Ps 139', false, false, NULL, NULL, NULL, false, 'X:1
T:Dunlapscreek
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e_ge2_d=B | A=B
% PHRASE_BREAK
=B2_g2=b_b |
a2_g
% PHRASE_BREAK
e_g4 | _g2=b_ba2_g2 | zz=B2
% PHRASE_BREAK
=B_de_g | e2_d2=B4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (152, 'recsyiOZAONaV9AED', 'St. Lawrence', 'CM', 'X:1
T:St. Lawrence
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2e=e_g3 | ae2_d2
% PHRASE_BREAK
=B2_g2 | a2=b2_g=e
% PHRASE_BREAK
=e_e | e2_d4_g2 |
=B2_d2e
% PHRASE_BREAK
=e_g2 | a_g=e_ea2=b2 | _g3ae2_d2 | =B6=B2 | =B2
', NULL, '{"doh":"Eb","time":"C","soprano":":d |m :m.f |s :-.l |m :r |d :s |l :d'' |s.f:f.m |m :r |— || :s |d :r |m.f:s |l.s:f.m |l :d'' |s :-.l |m :r |d :— |— || d |d ||","alto":":s_1 |d :d.t_1 |d :-.d |d :t_1 |d :d |d :d |t_1 :d |d :t_1 |— || :t_1 |d :t_1 |d.r:m.d |d :t_1.d |d :m |m.f:m.d |d :t_1 |d :— |— || l_1 |s_1 ||","tenor":":m |s :s |s :d''.l |s :f |m :m |f :s |s :s |s :— |— || :r |m :s |s.f:m |f.s:s |f :s |d''.t:d''.l |s :s.f |m :— |— || f |m ||","bass":":d |d :d.r |m :-.f |s :s_1 |d :d |f :m |r :d |s_1 :— |— || :s_1 |d :s.f |m.r:d |f.m:r.d |f_1 :d |d.r:m.f |s :s_1 |d :— |— || f_1 |d ||"}', 'X:1
T:St. Lawrence
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e2e=e_g3 | ae2_d2=B2_g2 | a2=b2_g=e=e_e | e2_d4_g2 | =B2_d2e=e_g2 | a_g=e_ea2=b2 | _g3ae2_d2 | =B6=B2 | =B2
[V:2] _G2=B2=B_B=B3 | =B=B2_B2=B2=B2 | =B2=B2_B2=B2 | =B2_B4=B2 | =B2_B2=B_de=B | =B2_B=B=B2e2 | e=e_e=B=B2_B2 | =B6A2 | _G2
[V:3] e2_g2_g2_g2 | =ba_g2=e2_e2 | e2=e2_g2_g2 | _g2_g6 | _d2e2_g2_g=e | e2=e_g_g2=e2 | _g2=b_b=ba_g2 | _g=e_e6 | =e2_e2
[V:4] =B2=B2=B_de3 | =e_g2_G2=B2=B2 | =e2_e2_d2=B2 | _G6_G2 | =B2_g=e_e_d=B2 | =e_e_d=B=E2=B2 | =B_de=e_g2_G2 | =B6=E2 | =B2', NULL, NULL, NULL, 'https://youtu.be/V1nZ_h9YbBY?si=gg5IoPHnXkjE3Io9', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Lawrence
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2e=e_g3 | ae2_d2
% PHRASE_BREAK
=B2_g2 | a2=b2_g=e
% PHRASE_BREAK
=e_e | e2_d4_g2 |
=B2_d2e
% PHRASE_BREAK
=e_g2 | a_g=e_ea2=b2 | _g3ae2_d2 | =B6=B2 | =B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (154, 'rectEF3ga5nvynZyY', 'Crediton', 'CM', 'X:1
T:Crediton
M:C
L:1/8
Q:1/4=76
K:C
g2c''2b2c''2 | g2a2gf e2
w: Praise ye the Lord. God''s praise wi- _ thin
% PHRASE_BREAK
| g2abc''2f2 e2 d6
w: his san- _ ctu- a- ry raise;
% PHRASE_BREAK
|
g2g2abc''2 | e''2 d''2 c''2 b2
w: And to him _ in the fir- ma- ment
% PHRASE_BREAK
| g2abc''2e''d'' | c''bc''6 | z2
w: of his _ pow''r give _ ye _ praise.', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :t |d'' :s |l :s.f |m :s |l.t:d'' |f :m |r :— |—|| :s |s :l.t |d'' :m'' |r'' :d'' |t :s |l.t:d'' |m''.r'':d''.t |d'' :— |—|| d'' d''||","alto":":m |m :f |s :m |f :m.r |d :d |d :d |t_1 :d |t_1 :— |—|| :s |s :f |m :s |f :m |r :s |f :s |f :m.r |m :— |—|| f m||","tenor":":s |s :s |s :d'' |d'' :t |d'' :d''.t |l :s |s :s |s :— |—|| :t |d'' :f |s :s |s :s |t :d'' |d''.r'':d'' |l :s |s :— |—|| l s||","bass":":d |d :r |m :d |f :s |d :m |f :m |r :d |s_1 :— |—|| :s.f |m :r |d :d |t_1 :d |s :m |f :m |f :s |d :— |—|| f d||"}', 'X:1
T:Crediton
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''2b2c''2 | g2a2gfe2 | g2abc''2f2 | e2d6 | g2g2abc''2 | e''2d''2c''2b2 | g2abc''2e''d'' | c''bc''6 | z2
[V:2] e2e2f2g2 | e2f2edc2 | c2c2c2B2 | c2B6 | g2g2f2e2 | g2f2e2d2 | g2f2g2f2 | ede6 | z2
[V:3] g2g2g2g2 | c''2c''2b2c''2 | c''ba2g2g2 | g2g6 | b2c''2f2g2 | g2g2g2b2 | c''2c''d''c''2a2 | g2g6 | z2
[V:4] c2c2d2e2 | c2f2g2c2 | e2f2e2d2 | c2G6 | gfe2d2c2 | c2B2c2g2 | e2f2e2f2 | g2c6 | z2', NULL, NULL, NULL, 'https://youtu.be/x9mF0qW0IKw?si=oolUho-_kLRihjEp', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Crediton
M:C
L:1/8
Q:1/4=76
K:C
g2c''2b2c''2 | g2a2gf
% PHRASE_BREAK
e2 | g2abc''2f2
% PHRASE_BREAK
 | e2d6 |
g2g2abc''2 | e''2
% PHRASE_BREAK
d''2c''2b2 | g2abc''2e''d'' | c''bc''6 | z2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (165, 'recxfEBF7BcwkPxFB', 'Spohr', 'CM', 'X:1
T:Spohr
M:C
L:1/8
Q:1/4=76
K:G
d2b4b2 | d''4g2b4 | a2g4
% PHRASE_BREAK
g2 | e''2d''2b2c''4 |
d''2
% PHRASE_BREAK
b4a4 | ^g2a4b2 | c''4e''2d''4
% PHRASE_BREAK
 | c''2b4c''2 | a4a2g4
', NULL, '{"doh":"G","time":"C","soprano":":s_1 | m :—:m | s :—:d | m :—:r | d :—:d | l :s :m | f :—:s | m :— | r :—:de | r :—:m | f :—:l | s :—:f | m :—:f | r :—:r | d :— || d | d","alto":":s_1 | d :—:d | d :—:d | d :—:t_1 | d :—:d | d :—:d | d :—:t_1 | d :— | t_1 :—:le_1 | t_1 :—:de | r :—:ma | r :—:r | d :—:d | d :—:t_1 | d :— || l_1 | s_1","tenor":":s | s :—:s | s :—:m | s :—:f | m :—:m | f :s :l | l :—:s | s :— | s :—:m | r :—:s | f :—:fe | s :—:s | s :—:l | r :—:f | m :— || f | m","bass":":s_1 | d :—:d | m :—:d | s_1 :—:s_1 | d :—:d | f :m :l_1 | r :—:s_1 | d :— | s_1 :—:s_1 | s_1 :f_1 :m_1 | r_1 :r :d | t_1 :—:t_1 | d :—:f_1 | s_1 :—:s_1 | d_1 :— || f_1 | d_1"}', 'X:1
T:Spohr
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2b4b2 | d''4g2b4 | a2g4g2 | e''2d''2b2c''4 | d''2b4a4 | ^g2a4b2 | c''4e''2d''4 | c''2b4c''2 | a4a2g4
[V:2] d2g4g2 | g4g2g4 | f2g4g2 | g4g2g4 | f2g4f4 | =f2^f4^g2 | a4^a2=a4 | a2g4g2 | g4f2g4
[V:3] d''2d''4d''2 | d''4b2d''4 | c''2b4b2 | c''2d''2e''2e''4 | d''2d''4d''4 | b2a4d''2 | c''4^c''2d''4 | d''2d''4e''2 | a4c''2b4
[V:4] d2g4g2 | b4g2d4 | d2g4g2 | c''2b2e2a4 | d2g4d4 | d2d2c2B2 | A2a2g2f4 | f2g4c2 | d4d2G4', NULL, NULL, NULL, 'https://youtu.be/WeszIWoJD7U?si=k2-N0sq6ORxOctCY', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Spohr
M:C
L:1/8
Q:1/4=76
K:G
d2b4b2 | d''4g2b4 | a2g4
% PHRASE_BREAK
g2 | e''2d''2b2c''4 |
d''2
% PHRASE_BREAK
b4a4 | ^g2a4b2 | c''4e''2d''4
% PHRASE_BREAK
 | c''2b4c''2 | a4a2g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (12, 'rec4wfzmEjIP3McyK', 'Bays of Harris', 'CM', 'X:1
T:Bays of Harris
M:C
L:1/8
Q:1/4=76
K:G
g2b2c''2d''2 |
e''2f''2g''4 | g''2
% PHRASE_BREAK
b2c''2d''2 | b2a2g4
% PHRASE_BREAK
', NULL, '{"doh":"G","time":"C","soprano":"d :m |f :s |l :t |d'' :— |d'' :m |f :s |m :r |d :—||","alto":"d :d |d :m |f :s |s :— |s :d |d :m |d :t_1 |d :—||","tenor":"m :s |l :s |l :t |d'' :— |d'' :s |l :s |s :s |m :—||","bass":"d :d |d :d |d :s_1 |m :— |m :d |d :d |s_1 :s_1 |d :—||"}', 'X:1
T:Bays of Harris
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2b2c''2d''2 | e''2f''2g''4 | g''2b2c''2d''2 | b2a2g4
[V:2] g2g2g2b2 | c''2d''2d''4 | d''2g2g2b2 | g2f2g4
[V:3] b2d''2e''2d''2 | e''2f''2g''4 | g''2d''2e''2d''2 | d''2d''2b4
[V:4] g2g2g2g2 | g2d2b4 | b2g2g2g2 | d2d2g4', NULL, NULL, NULL, 'https://youtu.be/H9W6XKbn6TE', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Bays of Harris
M:C
L:1/8
Q:1/4=76
K:G
g2b2c''2d''2 |
e''2f''2g''4 | g''2
% PHRASE_BREAK
b2c''2d''2 | b2a2g4
% PHRASE_BREAK
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (158, 'recv1ebdg1aHEsttt', 'Saxony', 'CM', 'X:1
T:Saxony
M:C
L:1/8
Q:1/4=76
K:Eb
e=e_g2=b2_b2 | a2_g2=B
% PHRASE_BREAK
_de2 | e=e_g2_g2
% PHRASE_BREAK
a_g | =e_e=e2_d6 |
b=b
% PHRASE_BREAK
_d''2_g2=e2 | =e2_g=e_e_d=e2 | =b_ba2_g2=e2 | e2a2_g4 | _d''2_g2=b2e2 | _d2=B6
', NULL, '{"doh":"Eb","time":"C","soprano":":m.f |s :d'' |t :l |s :d.r |m :m.f |s :s |l .s :f.m |m :r |— :— ||t .d'' |r'' :s |f :f |s .f :m.r |m :d'' .t |l :s |f :m |l :s |— :r'' |s :d'' |m :r |d :— |—||","alto":":d |d :m |r .m :f |d :d .t_1 |d :d |d :d |d :d |d :t_1 |— :— ||r |r :m |f .m :r .d |t_1 .r :d .t_1 |d :d |d :d |d :— |—||","tenor":":s |s :s |s :l .t |d'' :s |s :s |s :m |f :l |m :r |— :— ||s_1 .l_1 |t_1 :d |r .d :t_1 .l_1 |t_1 .r :d .t_1 |l_1 :d |d :d |f :m |l :s |— :s |s :s |s :— .f |m :— |—||","bass":":d .r |m :d |s :f |m :m.r |d :d .r |m :d |f_1 :f_1 |s_1 :— |— :— ||s_1 .l_1 |t_1 :d |r .d :t_1 .l_1 |s_1 :s_1 |d :d |d :m .s |d :— |—||"}', 'X:1
T:Saxony
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e=e_g2=b2_b2 | a2_g2=B_de2 | e=e_g2_g2a_g | =e_e=e2_d6 | b=b_d''2_g2=e2 | =e2_g=e_e_d=e2 | =b_ba2_g2=e2 | e2a2_g4 | _d''2_g2=b2e2 | _d2=B6
[V:2] =B2=B2e2_de | =e2=B2=B_B=B2 | =B2=B2=B2=B2 | =B2=B2_B6 | _d2_d2e2=e_e | _d=B_B_d=B_B=B2 | =B2=B2=B2=B6
[V:3] _g2_g2_g2_g2 | ab=b2_g2_g2 | _g2_g2e2=e2 | a2e2_d6 | _GAB2=B2_d=B | BAB_d=B_BA2 | =B2=B2=B2=e2 | e2a2_g4 | _g2_g2_g2_g3 | =e_e6
[V:4] =B_de2=B2_g2 | =e2_e2=e_d=B2 | =B_de2=B2=E2 | =E2_G8 | _GAB2=B2_d=B | BA_G2_G2=B2 | =B2=B2e_g=B6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Saxony
M:C
L:1/8
Q:1/4=76
K:Eb
e=e_g2=b2_b2 | a2_g2=B
% PHRASE_BREAK
_de2 | e=e_g2_g2
% PHRASE_BREAK
a_g | =e_e=e2_d6 |
b=b
% PHRASE_BREAK
_d''2_g2=e2 | =e2_g=e_e_d=e2 | =b_ba2_g2=e2 | e2a2_g4 | _d''2_g2=b2e2 | _d2=B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (162, 'recw7NAUSfJPpkI2j', 'Effingham', 'CM', 'X:1
T:Effingham
M:C
L:1/8
Q:1/4=76
K:C
g2c''4g2 | a4a2g4 |
f2e4
% PHRASE_BREAK
e2 | d4g2a2 | g2^f2
% PHRASE_BREAK
g4
', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :—:s |l :—:l |s :—:f |m :—:m |r :—:s |l :s :fe |s :—||","alto":":m |s :—:m |f :—:f |m :—:r |d :—:d |r :—:m |m :r :r |r :—||","tenor":":d'' |d'' :—:d'' |d'' :—:d'' |d'' :—:t |d'' :—:s |t :—:t |d'' :t :l |t :—||","bass":":d |m :—:d |f :—:f |s :—:s_1 |d :—:d |s :—:m |d :r :r_1 |s_1 :—||"}', 'X:1
T:Effingham
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''4g2 | a4a2g4 | f2e4e2 | d4g2a2 | g2^f2g4
[V:2] e2g4e2 | f4f2e4 | d2c4c2 | d4e2e2 | d2d2d4
[V:3] c''2c''4c''2 | c''4c''2c''4 | b2c''4g2 | b4b2c''2 | b2a2b4
[V:4] c2e4c2 | f4f2g4 | G2c4c2 | g4e2c2 | d2D2G4', NULL, NULL, NULL, 'https://youtu.be/cQSiDMBxp8s?si=EswJE2Kvwf1SYlU3', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Effingham
M:C
L:1/8
Q:1/4=76
K:C
g2c''4g2 | a4a2g4 |
f2e4
% PHRASE_BREAK
e2 | d4g2a2 | g2^f2
% PHRASE_BREAK
g4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (164, 'recwshtkkJx8wv4b1', 'St. Asaph', 'CM', 'X:1
T:St. Asaph
M:C
L:1/8
Q:1/4=76
K:G
d2g2g2a2 | a2b2d''c''
% PHRASE_BREAK
b2 | d''2c''2c''2b2 | b2
% PHRASE_BREAK
a6 | d2g2g2a2 | a2b2b
% PHRASE_BREAK
c''d''2 | d''2c''2c''2b2 | a2g6 |
b2c''2c''2a2 | a2d''2bc''d''2 | d''2e''2d''2c''2 | b2a6 | d2g2g2a2 | a2b2d''c''b2 | d''2c''2c''2b2 | a2g6 | g2g2', NULL, '{"doh":"G","time":"C","soprano":":s_1 |d :d |r :r |m :s.f |m :s |f :f |m :m |r :— |—|| :s_1 |d :d |r :r |m :m.f |s :s |f :f |m :r |d :— |—|| :m |f :f |r :r |s :m.f |s :s |l :s |f :m |r :— |—|| :s_1 |d :d |r :r |m :s.f |m :s |f :f |m :r |d :— |— ||d |d||","alto":":s_1 |s_1 :s_1 |t_1 :t_1 |d :d.t_1 |d :m |r :r |d :d |t_1 :— |—|| :s_1 |s_1 :m_1 |l_1 :s_1 |s_1 :d.t_1 |d :d |d :r |d :t_1 |d :— |—|| :d |d :d |t_1 :t_1 |d :d.t_1 |d :d |d :de |r :d |t_1 :— |—|| :s_1 |s_1 :d |d :t_1 |d :d.t_1 |d :d |d :r |d :t_1 |d :— |— ||l_1 |s_1||","tenor":":m |m :m |s :s |s :s |s :s |s :s |s :s |s :— |—|| :t_1 |d :d |d :t_1 |d :s.f |m :s |l :l |s :f |m :— |—|| :s |l :l |s :s |s :s |s :s |f :m |f :s.l |r :— |—|| :t_1 |d :m |s :s |s :s |s :s |l :l |s :-.f |m :— |— ||f |m||","bass":":d |d :d |s_1 :s_1 |d :m.r |d :d |t_1 :t_1 |d :d |s_1 :— |—|| :s_1.f_1 |m_1 :d_1 |f_1 :s_1 |m_1 :d.r |m :m_1 |f_1 :r_1 |s_1 :s_1 |d_1 :— |—|| :d |f_1 :f_1 |s_1 :s.f |m :d.r |m :m_1 |f_1 :l_1 |r_1 :m_1.f_1 |s_1 :— |—|| :s_1.f_1 |m_1 :l_1 |s_1 :s_1 |d :m.r |d :m_1 |f_1 :r_1 |s_1 :s_1 |d_1 :— |— ||f_1 |d_1||"}', 'X:1
T:St. Asaph
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2g2g2a2 | a2b2d''c''b2 | d''2c''2c''2b2 | b2a6 | d2g2g2a2 | a2b2bc''d''2 | d''2c''2c''2b2 | a2g6 | b2c''2c''2a2 | a2d''2bc''d''2 | d''2e''2d''2c''2 | b2a6 | d2g2g2a2 | a2b2d''c''b2 | d''2c''2c''2b2 | a2g6 | g2g2
[V:2] d2d2d2f2 | f2g2gfg2 | b2a2a2g2 | g2f6 | d2d2B2e2 | d2d2gfg2 | g2g2a2g2 | f2g6 | g2g2g2f2 | f2g2gfg2 | g2g2^g2a2 | g2f6 | d2d2g2g2 | f2g2gfg2 | g2g2a2g2 | f2g6 | e2d2
[V:3] b2b2b2d''2 | d''2d''2d''2d''2 | d''2d''2d''2d''2 | d''2d''6 | f2g2g2g2 | f2g2d''c''b2 | d''2e''2e''2d''2 | c''2b6 | d''2e''2e''2d''2 | d''2d''2d''2d''2 | d''2c''2b2c''2 | d''e''a6 | f2g2b2d''2 | d''2d''2d''2d''2 | d''2e''2e''2d''3 | c''b6c''2 | b2
[V:4] g2g2g2d2 | d2g2bag2 | g2f2f2g2 | g2d6 | dcB2G2c2 | d2B2gab2 | B2c2A2d2 | d2G6 | g2c2c2d2 | d''c''b2gab2 | B2c2e2A2 | Bcd6 | dcB2e2d2 | d2g2bag2 | B2c2A2d2 | d2G6 | c2G2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=fhaULGDe4LU&ab_channel=nanciekoo', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:St. Asaph
M:C
L:1/8
Q:1/4=76
K:G
d2g2g2a2 | a2b2d''c''
% PHRASE_BREAK
b2 | d''2c''2c''2b2 | b2
% PHRASE_BREAK
a6 | d2g2g2a2 | a2b2b
% PHRASE_BREAK
c''d''2 | d''2c''2c''2b2 | a2g6 |
b2c''2c''2a2 | a2d''2bc''d''2 | d''2e''2d''2c''2 | b2a6 | d2g2g2a2 | a2b2d''c''b2 | d''2c''2c''2b2 | a2g6 | g2g2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (14, 'rec5MmJzN1kS5sLiz', 'Selma', 'SM', 'X:1
T:Selma
M:C
L:1/8
Q:1/4=76
K:E
e2g2f2e2 | fg
% PHRASE_BREAK
b6 | b2c''2b2g2 | B
% PHRASE_BREAK
c''c''6 |
c''2b2c''e''e''2 | b2
% PHRASE_BREAK
c''2g2f2 | e2fgb2f2 | f2e6 | e2e2
', NULL, '{"doh":"E","time":"C","soprano":":d |m :r |d :r.m |s :— |— :s |l :s |m :s_1.l |l :— |— |:l |s :l.d'' |d'' :s |l :m |r :d |r.m:s |r :r |d :— |— || d |d ||","alto":":d |d :t_1 |d :s_1.d |t_1 :— |— :d |d :d |d :d |d :— |— |:d |d :d |d :d |d :d |t_1 :s_1 |s_1 :d |d :t_1 |d :— |— || l_1 |s_1 ||","tenor":":m |s :f |m.s:f.m |r :— |— :m |f :s |s :m.f |f :— |— |:f |m :l |s :m |f :s |s :m |r.d:s |l :s.f |m :— |— || f |m ||","bass":":d |d :s_1 |l_1 :t_1.d |s_1 :— |— :d |f :m |d :d |f_1 :— |— |:f_1 |d :f |m :d |f_1 :d |s_1 :d |t_1.d:m_1 |f_1 :s_1 |d :— |— || f_1 |d ||"}', 'X:1
T:Selma
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] e2g2f2e2 | fgb6 | b2c''2b2g2 | Bc''c''6 | c''2b2c''e''e''2 | b2c''2g2f2 | e2fgb2f2 | f2e6 | e2e2
[V:2] e2e2d2e2 | Bed6 | e2e2e2e2 | e2e6 | e2e2e2e2 | e2e2e2d2 | B2B2e2e2 | d2e6 | c2B2
[V:3] g2b2a2gb | agf6 | g2a2b2b2 | gaa6 | a2g2c''2b2 | g2a2b2b2 | g2feb2c''2 | bag6 | a2g2
[V:4] e2e2B2c2 | deB6 | e2a2g2e2 | e2A6 | A2e2a2g2 | e2A2e2B2 | e2deG2A2 | B2e6 | A2e2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=YF24p-QeGH0&ab_channel=ParksideEvangelicalChurch', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Selma
M:C
L:1/8
Q:1/4=76
K:E
e2g2f2e2 | fg
% PHRASE_BREAK
b6 | b2c''2b2g2 | B
% PHRASE_BREAK
c''c''6 |
c''2b2c''e''e''2 | b2
% PHRASE_BREAK
c''2g2f2 | e2fgb2f2 | f2e6 | e2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (39, 'recFAuqk4Z0idgQF0', 'Silchester', 'SM', 'X:1
T:Silchester
M:C
L:1/8
Q:1/4=76
K:Eb
_g2_g2e=e_g2 | a2
% PHRASE_BREAK
_g6 | _g2a=b_ba
% PHRASE_BREAK
_g2 |
=e2_e6 | =b2=b2_ba_g2
% PHRASE_BREAK
 | =e2_e=e_ga_g2 | _g2a2a2b2 | b2=b6
', NULL, '{"doh":"Eb","time":"C","soprano":":s |s :m.f|s :l |s :— |— :s |l.d'':t.l|s :f |m :— |—|| :d'' |d'' :t.l|s :f |m.f:s.l|s :s |l :l |t :t |d'' :— |—||","alto":":m |m :d.r|m :f |m :— |— :m |f.l :s.f|m :r |d :— |—|| :m |m :s.f|m :r |d.r:m.f|m :m |f :f |r :r.f|m :— |—||","tenor":":s |s :s |d'' :d'' |d'' :— |— :d'' |d'' :d'' |s :s |s :— |—|| :s |s :s |s :s |s :s |s :d'' |d'' :d''.l|s :s |s :— |—||","bass":":d |d :d |d :d |d :— |— :d |f_1 :f_1 |s_1 :s_1 |d :— |—|| :d |d :d |d :d |d :d |d :d |f :r |s :s_1 |d :— |—||"}', 'X:1
T:Silchester
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2_g2e=e_g2 | a2_g6 | _g2a=b_ba_g2 | =e2_e6 | =b2=b2_ba_g2 | =e2_e=e_ga_g2 | _g2a2a2b2 | b2=b6
[V:2] e2e2=B_de2 | =e2_e6 | e2=ea_g=e_e2 | _d2=B6 | e2e2_g=e_e2 | _d2=B_de=e_e2 | e2=e2=e2_d2 | _d=e_e6
[V:3] _g2_g2_g2=b2 | =b2=b6 | =b2=b2=b2_g2 | _g2_g6 | _g2_g2_g2_g2 | _g2_g2_g2_g2 | =b2=b2=ba_g2 | _g2_g6
[V:4] =B2=B2=B2=B2 | =B2=B6 | =B2=E2=E2_G2 | _G2=B6 | =B2=B2=B2=B2 | =B2=B2=B2=B2 | =B2=e2_d2_g2 | _G2=B6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Silchester
M:C
L:1/8
Q:1/4=76
K:Eb
_g2_g2e=e_g2 | a2
% PHRASE_BREAK
_g6 | _g2a=b_ba
% PHRASE_BREAK
_g2 |
=e2_e6 | =b2=b2_ba_g2
% PHRASE_BREAK
 | =e2_e=e_ga_g2 | _g2a2a2b2 | b2=b6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (170, 'reczUnx2Cm6XfxCNG', 'Ericstane', 'CM', 'X:1
T:Ericstane
M:C
L:1/8
Q:1/4=76
K:Bb
d2c2B2c2 | B4F2G4 | B2
% PHRASE_BREAK
c4d2 | f2F2G2B4
% PHRASE_BREAK
 |
B2c4d2 | c2B2c2B4 | B2
% PHRASE_BREAK
c4c2 | d4F2G2 | F2G2B4 | B2B4
', NULL, '{"doh":"Bb","time":"C","soprano":":m | r :d :r | d :- :s_1 | l_1 :- :d | r :- :m | s :s_1 :l_1 | d :- :d | r :- || :m | r :d :r | d :- :d | r :- :r | m :- :s_1 | l_1 :s_1 :l_1 | d :- :d | d :- ||","alto":":s_1 | s_1 :- :s_1 | m_1 :- :s_1 | s_1 :f_1 :m_1 | s_1 :- :s_1 | s_1 :- :s_1 | s_1 :- :m_1 | s_1 :- || :s_1 | s_1 :- :s_1 | m_1 :- :s_1 | s_1 :- :s_1 | s_1 :- :m_1 | f_1 :m_1 :f_1 | m_1 :- :f_1 | m_1 :- ||","tenor":":d | t_1 :l_1 :t_1 | d :- :d | d :- :d | t_1 :- :d | m :- :d | d :- :d | d :t_1 || :d | t_1 :l_1 :t_1 | d :- :d | d :- :t_1 | d :- :d | d :- :d | d :- :l_1 | s_1 :- ||","bass":":d_1 | s_1 :- :s_1 | d_1 :- :m_1 | f_1 :- :l_1 | s_1 :- :d_1 | d_1 :- :f_1 | m_1 :- :l_1 | s_1 :- || :d_1 | s_1 :- :s_1 | l_1 :- :m_1 | s_1 :- :s_1 | d_1 :- :d_1 | d_1 :- :d_1 | d_1 :- :f_1 | d_1 :- ||"}', 'X:1
T:Ericstane
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] d2c2B2c2 | B4F2G4 | B2c4d2 | f2F2G2B4 | B2c4d2 | c2B2c2B4 | B2c4c2 | d4F2G2 | F2G2B4 | B2B4
[V:2] F2F4F2 | D4F2F2 | E2D2F4 | F2F4F2 | F4D2F4 | F2F4F2 | D4F2F4 | F2F4D2 | E2D2E2D4 | E2D4
[V:3] B2A2G2A2 | B4B2B4 | B2A4B2 | d4B2B4 | B2B2A2B2 | A2G2A2B4 | B2B4A2 | B4B2B4 | B2B4G2 | F4
[V:4] B,2F4F2 | B,4D2E4 | G2F4B,2 | B,4E2D4 | G2F4B,2 | F4F2G4 | D2F4F2 | B,4B,2B,4 | B,2B,4E2 | B,4', NULL, NULL, NULL, 'https://youtu.be/3gO2W531n6k?si=wBCuJjN3tx0-6lWO', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Ericstane
M:C
L:1/8
Q:1/4=76
K:Bb
d2c2B2c2 | B4F2G4 | B2
% PHRASE_BREAK
c4d2 | f2F2G2B4
% PHRASE_BREAK
 |
B2c4d2 | c2B2c2B4 | B2
% PHRASE_BREAK
c4c2 | d4F2G2 | F2G2B4 | B2B4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (105, 'reccMphjYPNvfl3Ol', 'Peterborough', 'CM', 'X:1
T:Peterborough
M:C
L:1/8
Q:1/4=76
K:F
f2a2a2b2 | b2a2g2f2
% PHRASE_BREAK
 | a2c''2c''2b2 | a2g6
% PHRASE_BREAK
 |
a2g2g2a2 | f2b2a2g2
% PHRASE_BREAK
 | g2a2c''2b2 | g2f6 | f2f2
', NULL, '{"doh":"F","time":"C","soprano":":d |m :m |f :f |m :r |d :m |s :s |f :m |r :— |— || :m |r :r |m :d |f :m |r :r |m :s |f :r |d :— |— || d | d ||","alto":":d |d :d |d :d |d :t_1 |d :d |r :d |d :d |t_1 :— |— || :d |t_1 :t_1 |s_1 :l_1 |d :d |t_1 :t_1 |d :d |d :t_1 |d :— |— || l_1 | s_1 ||","tenor":":m |s :s |l :l |s :f |m :s |s :m |l :s |s :— |— || :s |s :s |m :m |l :s |s :s |s :s |l :s.f |m :— |— || f | m ||","bass":":d |d :d |f_1 :f_1 |s_1 :s_1 |d :d |t_1 :d |f_1 :d |s_1 :— |— || :d |s_1 :s_1 |d :l_1 |f_1 :d |s_1 :s_1 |d :m_1 |f_1 :s_1 |d :— |— || f_1 | d ||"}', 'X:1
T:Peterborough
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2a2a2b2 | b2a2g2f2 | a2c''2c''2b2 | a2g6 | a2g2g2a2 | f2b2a2g2 | g2a2c''2b2 | g2f6 | f2f2
[V:2] f2f2f2f2 | f2f2e2f2 | f2g2f2f2 | f2e6 | f2e2e2c2 | d2f2f2e2 | e2f2f2f2 | e2f6 | d2c2
[V:3] a2c''2c''2d''2 | d''2c''2b2a2 | c''2c''2a2d''2 | c''2c''6 | c''2c''2c''2a2 | a2d''2c''2c''2 | c''2c''2c''2d''2 | c''ba6 | b2a2
[V:4] f2f2f2B2 | B2c2c2f2 | f2e2f2B2 | f2c6 | f2c2c2f2 | d2B2f2c2 | c2f2A2B2 | c2f6 | B2f2', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Peterborough
M:C
L:1/8
Q:1/4=76
K:F
f2a2a2b2 | b2a2g2f2
% PHRASE_BREAK
 | a2c''2c''2b2 | a2g6
% PHRASE_BREAK
 |
a2g2g2a2 | f2b2a2g2
% PHRASE_BREAK
 | g2a2c''2b2 | g2f6 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (79, 'recUAB5ubuYEcxlkV', 'Stracathro', 'CM', 'X:1
T:Stracathro
M:C
L:1/8
K:Eb
=B2e4_d2 | =B4_d2e2 | =b2_b2
% PHRASE_BREAK
a4 | =b2_g2e2=B2 | e4
% PHRASE_BREAK
_d2=B4 | e2e4_d2 | =B2e2_g2
% PHRASE_BREAK
a2 | _d''2=b2_b4 | b2=b2_g2a2 | e4_d2=B4', NULL, '[object Object]', 'X:1
T:Stracathro
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e4_d2 | =B4_d2e2 | =b2_b2a4 | =b2_g2e2=B2 | e4_d2=B4
[V:2] =B2=B4_B2 | =B2A2_d2=B2 | e2e_d=B4 | =B2=B4=B2 | =B4_B2=B4
[V:3] e2_g4_g=e | e4_g2_g2 | a2g2a4 | _ga_g4=B2 | _g4=e2_e4
[V:4] =B2=B4_G2 | A4B2=B2 | A2e2=e4 | e=e_e2=B2A2 | _G4_G2=B4', NULL, NULL, NULL, 'https://youtu.be/oIiPt8XzFko?si=fa4FPwxU-w_F4l2X', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Stracathro
M:C
L:1/8
K:Eb
=B2e4_d2 | =B4_d2e2 | =b2_b2
% PHRASE_BREAK
a4 | =b2_g2e2=B2 | e4
% PHRASE_BREAK
_d2=B4 | e2e4_d2 | =B2e2_g2
% PHRASE_BREAK
a2 | _d''2=b2_b4 | b2=b2_g2a2 | e4_d2=B4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (16, 'rec5dQPidqJAgDg2e', 'Aspurg', 'CM', 'X:1
T:Aspurg
M:C
L:1/8
Q:1/4=76
K:D
a2d''2a2f2 | b2a2ag
% PHRASE_BREAK
f2 | e2d2f^ga2
% PHRASE_BREAK
 | b2a6 |
a2c''2a2d''2 | f2g2
% PHRASE_BREAK
f2e2 | fga2d''2d''2 | c''2d''6 | d''2d''2
', NULL, '{"doh":"D","time":"C","soprano":":s |d'' :s |m :l |s :s.f |m :r |d :m.fe |s :l |s :— |—|| :s |t :s |d'' :m |f :m |r :m.f |s :d'' |d'' :t |d'' :— |—|| d'' |d''||","alto":":d |m :r |d :d |d :t_1 |d :t_1 |d :d |t_1 :r.d |t_1 :— |—|| :t_1 |r :t_1 |d :d |r :d |t_1 :d |d :d.r |m :r |m :— |—|| f |m||","tenor":":m |s :s |s :f.m |r :s |s :s.f |m :l |s :fe |s :— |—|| :s |s :s |s :s |s :s |s :s.f |m :m.f |s :s |s :— |—|| l |s||","bass":":d |d :t_1 |d :f_1 |s_1 :s_1 |d :s_1 |l_1 :l_1 |m :r |s_1 :— |—|| :s_1 |s :s.f |m :d |t_1 :d |s_1 :d.r |m :l_1 |s_1 :s_1 |d :— |—|| f |d||"}', 'X:1
T:Aspurg
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2d''2a2f2 | b2a2agf2 | e2d2f^ga2 | b2a6 | a2c''2a2d''2 | f2g2f2e2 | fga2d''2d''2 | c''2d''6 | d''2d''2
[V:2] d2f2e2d2 | d2d2c2d2 | c2d2d2c2 | edc6 | c2e2c2d2 | d2e2d2c2 | d2d2def2 | e2f6 | g2f2
[V:3] f2a2a2a2 | gfe2a2a2 | agf2b2a2 | ^g2a6 | a2a2a2a2 | a2a2a2a2 | agf2fga2 | a2a6 | b2a2
[V:4] d2d2c2d2 | G2A2A2d2 | A2B2B2f2 | e2A6 | A2a2agf2 | d2c2d2A2 | def2B2A2 | A2d6 | g2d2', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Aspurg
M:C
L:1/8
Q:1/4=76
K:D
a2d''2a2f2 | b2a2ag
% PHRASE_BREAK
f2 | e2d2f^ga2
% PHRASE_BREAK
 | b2a6 |
a2c''2a2d''2 | f2g2
% PHRASE_BREAK
f2e2 | fga2d''2d''2 | c''2d''6 | d''2d''2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (68, 'recQ41LMlTAS6y2aj', 'Cheshire (LRF??)', 'CM', 'X:1
T:Cheshire (LRF??)
M:C
L:1/8
Q:1/4=76
K:Fm
F2F2G2A2 | A2G3GF2
% PHRASE_BREAK
 | F2A3AB2 |
e2c6
% PHRASE_BREAK
 | c2c3cB2 | G2A2B2c2
% PHRASE_BREAK
 | c2B2A2B2 | G2F6
', NULL, '{"doh":"Ab","time":"C","soprano":":l_1 | l_1 :t_1 | d :d | t_1 :-.t_1 | l_1 :l_1 | d :-.d | r :s | m :— | —|| :m | m :-.m | r :t_1 | d :r | m :m | r :d | r :t_1 | l_1 :— | —||","alto":":m_1 | m_1 :se_1 | l_1 :l_1 | l_1 :se_1 | l_1 :l_1 | s_1 :-.m_1 | s_1 :s_1 | s_1 :— | —|| :s_1 | s_1 :-.s_1 | s_1 :s_1 | m_1 :l_1 | se_1 :s_1 | s_1 :m_1 | l_1 :se_1 | l_1 :— | —||","tenor":":d | d :r | m :f | f :m | d :d | d :-.d | d :t_1 | d :— | —|| :d | d :-.d | t_1 :r | d :l_1 | t_1 :d | t_1 :d | f :m.r | d :— | —||","bass":":l_1 | d :t_1 | l_1 :f_1 | r_1 :m_1 | l_1 :f_1 | m_1 :-.l_1 | s_1 :s_1 | d :— | —|| :d_1 | d_1 :-.m_1 | s_1 :s_1 | l_1 :f_1 | m_1 :d_1 | s_1 :l_1 | r_1 :m_1 | l_1 :— | —||","lah":"F","mode":"minor"}', 'X:1
T:Cheshire (LRF??)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Fm
[V:1] F2F2G2A2 | A2G3GF2 | F2A3AB2 | e2c6 | c2c3cB2 | G2A2B2c2 | c2B2A2B2 | G2F6
[V:2] C2C2=E2F2 | F2F2=E2F2 | F2E3CE2 | E2E6 | E2E3EE2 | E2C2F2=E2 | E2E2C2F2 | =E2F6
[V:3] A2A2B2c2 | d2d2c2A2 | A2A3AA2 | G2A6 | A2A3AG2 | B2A2F2G2 | A2G2A2d2 | cBA6
[V:4] F2A2G2F2 | D2B,2C2F2 | D2C3FE2 | E2A6 | A,2A,3CE2 | E2F2D2C2 | A,2E2F2B,2 | C2F6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=C55JIAVFJL8&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Cheshire (LRF??)
M:C
L:1/8
Q:1/4=76
K:Fm
F2F2G2A2 | A2G3GF2
% PHRASE_BREAK
 | F2A3AB2 |
e2c6
% PHRASE_BREAK
 | c2c3cB2 | G2A2B2c2
% PHRASE_BREAK
 | c2B2A2B2 | G2F6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (70, 'recR6FOMm5leEIJvY', 'London New', 'CM', 'X:1
T:London New
M:C
L:1/8
Q:1/4=76
K:E
e2b2g2e''2 | b2c''2e''2d''2
% PHRASE_BREAK
 | b2e''2g2b2 |
f2e6
% PHRASE_BREAK
 | b2e''2c''2d''2 | b2c''2c''2b2
% PHRASE_BREAK
 | g2b2e''2g2 | f2e6
', NULL, '{"doh":"E","time":"C","soprano":":d |s :m |d'' :s |l :d'' |t :s |d'' :m |s :r |d :—|—|| :s |d'' :l |t :s |l :l |s :m |s :d'' |m :r |d :—|—|| d |d","alto":":d |r :d |m :d |d :m |r :t_1 |d :d |d :t_1 |d :—|—|| :r |d :r |r :t_1 |m :r.d |t_1 :d |r :d |d :t_1 |d :—|—|| l_1 |s_1","tenor":":m |s :s |l :d'' |l :s |s :s |s :l |s :s.f |m :—|—|| :r |m :fe |fe :s |s :fe |s :s |r :m.f |s :s.f |m :—|—|| f |m","bass":":d |t_1 :d |l_1 :m |f :d |s_1 :s.f |m :l |m :s |d :—|—|| :t_1 |l_1 :r |t_1 :m |d :r |s_1 :d |t_1 :l_1 |s_1 :s_1 |d :—|—|| f_1 |d"}', 'X:1
T:London New
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] e2b2g2e''2 | b2c''2e''2d''2 | b2e''2g2b2 | f2e6 | b2e''2c''2d''2 | b2c''2c''2b2 | g2b2e''2g2 | f2e6
[V:2] e2f2e2g2 | e2e2g2f2 | d2e2e2e2 | d2e6 | f2e2f2f2 | d2g2fed2 | e2f2e2e2 | d2e6
[V:3] g2b2b2c''2 | e''2c''2b2b2 | b2b2c''2b2 | bag6 | f2g2^a2^a2 | b2b2^a2b2 | b2f2gab2 | bag6
[V:4] e2d2e2c2 | g2a2e2B2 | bag2c''2g2 | b2e6 | d2c2f2d2 | g2e2f2B2 | e2d2c2B2 | B2e6', NULL, NULL, NULL, 'https://youtu.be/peuzKcvVVb0?feature=shared', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:London New
M:C
L:1/8
Q:1/4=76
K:E
e2b2g2e''2 | b2c''2e''2d''2
% PHRASE_BREAK
 | b2e''2g2b2 |
f2e6
% PHRASE_BREAK
 | b2e''2c''2d''2 | b2c''2c''2b2
% PHRASE_BREAK
 | g2b2e''2g2 | f2e6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (169, 'recywlBg9ZwV0hd6h', 'Beatitudo', 'CM', 'X:1
T:Beatitudo
M:C
L:1/8
Q:1/4=76
K:Ab
A2B2c2e4 | c2A4d2 | c6
% PHRASE_BREAK
F2 | G2A2c4 |
B2B6
% PHRASE_BREAK
 | B2e2d2c4 | A2c4B2 | A4
% PHRASE_BREAK
B2c4 | c2d4G2 | A6
', NULL, '{"doh":"Ab","time":"C","soprano":"d :r :m | s :—:m | d :—:f | m :—:— | l_1 :t_1 :d | m :—:r | r :—:— || r :s :f | m :—:d | m :—:r | d :—:r | m :—:m | f :—:t_1 | d :—:—||","alto":"m_1 :s_1 :s_1 | s_1 :—:s_1 | f_1 :m_1 :l_1 | s_1 :—:— | s_1 :s_1 :s_1 | fe_1 :—:fe_1 | s_1 :—:— || t_1 :d :r | s_1 :—:l_1 | se_1 :—:se_1 | l_1 :—:l_1 | s_1 :—:ta_1 | t_1 :—:s_1 | s_1 :—:—||","tenor":"s :f :m | d :—:d | d :—:d | d :—:— | m :m :m | d :—:l_1 | t_1 :—:— || f :m :r | d :—:d | t_1 :—:t_1 | d :—:d | d :—:de | r :—:f | m :—:—||","bass":"d :d :d | m_1 :—:s_1 | l_1 :s_1 :f_1 | d_1 :—:— | d :t_1 :l_1 | r_1 :—:r_1 | s_1 :—:— || s_1 :l_1 :t_1 | d :—:l_1 | m_1 :—:m_1 | l_1 :—:f_1 | s_1 :—:s_1 | s_1 :—:s_1 | d_1 :—:—||"}', 'X:1
T:Beatitudo
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] A2B2c2e4 | c2A4d2 | c6F2 | G2A2c4 | B2B6 | B2e2d2c4 | A2c4B2 | A4B2c4 | c2d4G2 | A6
[V:2] C2E2E2E4 | E2D2C2F2 | E6E2 | E2E2=D4 | =D2E6 | G2A2B2E4 | F2=E4=E2 | F4F2E4 | _G2=G4E2 | E6
[V:3] e2d2c2A4 | A2A4A2 | A6c2 | c2c2A4 | F2G6 | d2c2B2A4 | A2G4G2 | A4A2A4 | =A2B4d2 | c6
[V:4] A2A2A2C4 | E2F2E2D2 | A,6A2 | G2F2B,4 | B,2E6 | E2F2G2A4 | F2C4C2 | F4D2E4 | E2E4E2 | A,6', NULL, NULL, NULL, 'https://youtu.be/6yakL9N7oZU?si=eYUiWKfX3QVRg7JX', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Beatitudo
M:C
L:1/8
Q:1/4=76
K:Ab
A2B2c2e4 | c2A4d2 | c6
% PHRASE_BREAK
F2 | G2A2c4 |
B2B6
% PHRASE_BREAK
 | B2e2d2c4 | A2c4B2 | A4
% PHRASE_BREAK
B2c4 | c2d4G2 | A6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (93, 'recYUmQAN3AK76xxS', 'Orton', 'CM', 'X:1
T:Orton
M:C
L:1/8
Q:1/4=76
K:Ab
E2A4A2 | B4B2c4 | B2A4
% PHRASE_BREAK
E2 | F4F2A4 |
F2E4
% PHRASE_BREAK
E2 | A4A2B4 | B2c4d2 | e4
% PHRASE_BREAK
e2c4 | A2B4B2 | A4
', NULL, '{"doh":"Ab","time":"C","soprano":":s_1 |d :—:d |r :—:r |m :—:r |d :—:s_1 |l_1 :—:l_1 |d :—:l_1 |s_1 :—|| :s_1 |d :—:d |r :—:r |m :—:f |s :—:s |m :—:d |r :—:r |d :—||","alto":":m_1 |m :—:s_1 |s_1 :—:s_1 |s_1 :—:f_1 |m_1 :—:m_1 |f_1 :—:f_1 |l_1 :—:f_1 |m_1 :—|| :m_1 |m :—:s_1 |s_1 :—:s_1 |s_1 :—:s_1 |s_1 :—:s_1 |s_1 :—:s_1 |l_1 :—:s_1 |m_1 :—||","tenor":":d |d :—:d |t_1 :—:t_1 |d :—:t_1 |d :—:d |d :—:d |d :—:d |d :—|| :d |d :—:d |t_1 :—:t_1 |d :—:r |m :—:r |d. :—:d |d :—:t_1 |d :—||","bass":":d_1 |d_1 :—:m_1 |s_1 :—:s_1 |d :—:s_1 |d_1 :—:d_1 |f_1 :—:f_1 |f_1 :—:f_1 |d_1 :—|| :d_1 |d_1 :—:m_1 |s_1 :—:s_1 |d :—:d |d :—:t_1 |d :—:m_1 |f_1 :—:s_1 |d_1 :—||"}', 'X:1
T:Orton
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Ab
[V:1] E2A4A2 | B4B2c4 | B2A4E2 | F4F2A4 | F2E4E2 | A4A2B4 | B2c4d2 | e4e2c4 | A2B4B2 | A4
[V:2] C2c4E2 | E4E2E4 | D2C4C2 | D4D2F4 | D2C4C2 | c4E2E4 | E2E4E2 | E4E2E4 | E2F4E2 | C4
[V:3] A2A4A2 | G4G2A4 | G2A4A2 | A4A2A4 | A2A4A2 | A4A2G4 | G2A4B2 | c4B2A4 | A2A4G2 | A4
[V:4] A,2A,4C2 | E4E2A4 | E2A,4A,2 | D4D2D4 | D2A,4A,2 | A,4C2E4 | E2A4A2 | A4G2A4 | C2D4E2 | A,4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Orton
M:C
L:1/8
Q:1/4=76
K:Ab
E2A4A2 | B4B2c4 | B2A4
% PHRASE_BREAK
E2 | F4F2A4 |
F2E4
% PHRASE_BREAK
E2 | A4A2B4 | B2c4d2 | e4
% PHRASE_BREAK
e2c4 | A2B4B2 | A4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (100, 'recasNDXvMR8FYY9x', 'Norwich', 'CM', 'X:1
T:Norwich
M:C
L:1/8
Q:1/4=76
K:Em
e2g2a2b2 | b2c''2c''2b2
% PHRASE_BREAK
 | b2c''2g2a2 | a2g6
% PHRASE_BREAK
 |
g2b2c''2d''2 | b2a2g2f2
% PHRASE_BREAK
 | b2a2e2g2 | f2e6 | e2e2
', NULL, '{"doh":"G","time":"C","soprano":":l_1 |d :r |m :m |f :f |m :m |f :d |r :r |d :—|—|| :d |m :f |s :m |r :d |t_1 :m |r :l_1 |d :t_1 |l_1 :—|—|| l_1 |l_1 ||","alto":":m_1 |l_1 :l_1 |se_1 :l_1 |l_1 :s_1 |s_1 :s_1 |l_1 :m_1 |s_1 :s_1.f_1 |m_1 :—|—|| :s_1 |d :d |t_1 :s_1 |l_1 :m_1.f_1 |s_1 :m_1 |l_1 :l_1 |l_1 :se_1 |l_1 :—|—|| f_1 |m_1 ||","tenor":":d |m :r |t_1 :d |d :t_1 |d :d |d :d |d :t_1 |d :—|—|| :m |s :f |r :m |f :d |r :d |l_1.t_1 :d.r |m :—.r |d :—|—|| r |de ||","bass":":l_1 |l_1 :f_1 |m_1 :l_1 |r_1 :s_1 |d_1 :d_1 |f_1 :l_1 |s_1 :s_1 |d_1 :—|—|| :d |d :l_1 |s_1 :d |f_1 :l_1 |s_1 :d_1 |f_1 :f_1 |m_1 :m_1 |l_1 :—|—|| r_1 |l_1 ||","lah":"E","mode":"minor"}', 'X:1
T:Norwich
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Em
[V:1] e2g2a2b2 | b2c''2c''2b2 | b2c''2g2a2 | a2g6 | g2b2c''2d''2 | b2a2g2f2 | b2a2e2g2 | f2e6 | e2e2
[V:2] B2e2e2^d2 | e2e2d2d2 | d2e2B2d2 | dcB6 | d2g2g2f2 | d2e2Bcd2 | B2e2e2e2 | ^d2e6 | c2B2
[V:3] g2b2a2f2 | g2g2f2g2 | g2g2g2g2 | f2g6 | b2d''2c''2a2 | b2c''2g2a2 | g2efgab3 | ag6a2 | ^g2
[V:4] e2e2c2B2 | e2A2d2G2 | G2c2e2d2 | d2G6 | g2g2e2d2 | g2c2e2d2 | G2c2c2B2 | B2e6 | A2e2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Norwich
M:C
L:1/8
Q:1/4=76
K:Em
e2g2a2b2 | b2c''2c''2b2
% PHRASE_BREAK
 | b2c''2g2a2 | a2g6
% PHRASE_BREAK
 |
g2b2c''2d''2 | b2a2g2f2
% PHRASE_BREAK
 | b2a2e2g2 | f2e6 | e2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (47, 'recIH8JWPhTp2pxsq', 'Bangor', 'CM', 'X:1
T:Bangor
M:C
L:1/8
Q:1/4=76
K:Dm
a2f2e2d2 | a2d''2c''b
% PHRASE_BREAK
a2 | a2a2c''=ba2
% PHRASE_BREAK
 |
_a2=a6 | a2d''2_d''2=d''2 | f''e''
% PHRASE_BREAK
d''2c''ba2 | a2d''2agf2 | e2d6
', NULL, '{"doh":"F","time":"C","soprano":":m | d :t_1 | l_1 :m | l :s.f | m :m | m :s.fe | m :re | m :- | - || :m | l :se | l :d''.t | l :s.f | m :m | l :m.r | d :t_1 | l_1 :- | - ||","alto":":d | l_1 :se_1 | l_1 :d | d :t_1 | d :d | t_1 :t_1.d | t_1 :l_1 | s_1 :- | - || :m | m :r | d :d | d :t_1 | m :r | d :l_1 | l_1 :se_1 | l_1 :- | - ||","tenor":":d | m :m.r | d :d | f :r | m :l | t :m.l | s :fe | m :- | - || :se | l :m | m :s | f :r.s | s :se | m :l.f | m :m.r | d :- | - ||","bass":":l_1 | l_1 :m_1 | l_1 :l_1 | f_1 :s_1 | d :l_1 | s_1 :s_1.l_1 | t_1 :t_1 | m_1 :- | - || :m.r | d :t_1 | l_1 :m_1 | f_1 :s_1 | d :t_1 | l_1 :d.r | m :m_1 | l_1 :- | - ||","lah":"D","mode":"minor"}', 'X:1
T:Bangor
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Dm
[V:1] a2f2e2d2 | a2d''2c''ba2 | a2a2c''=ba2 | _a2=a6 | a2d''2_d''2=d''2 | f''e''d''2c''ba2 | a2d''2agf2 | e2d6
[V:2] f2d2_d2=d2 | f2f2e2f2 | f2e2efe2 | d2c6 | a2a2g2f2 | f2f2e2a2 | g2f2d2d2 | _d2=d6
[V:3] f2a2agf2 | f2b2g2a2 | d''2e''2ad''c''2 | =b2a6 | _d''2=d''2a2a2 | c''2b2gc''c''2 | _d''2a2=d''ba2 | agf6
[V:4] d2d2A2d2 | d2B2c2f2 | d2c2cde2 | e2A6 | agf2e2d2 | A2B2c2f2 | e2d2fga2 | A2d6', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Bangor
M:C
L:1/8
Q:1/4=76
K:Dm
a2f2e2d2 | a2d''2c''b
% PHRASE_BREAK
a2 | a2a2c''=ba2
% PHRASE_BREAK
 |
_a2=a6 | a2d''2_d''2=d''2 | f''e''
% PHRASE_BREAK
d''2c''ba2 | a2d''2agf2 | e2d6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (150, 'recstPp3CxclEQdsA', 'Gräfenberg', 'CM', 'X:1
T:Gräfenberg
M:C
L:1/8
Q:1/4=76
K:G
g2e2d2g2 | a2b2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 | a2g6
% PHRASE_BREAK
 |
d''c''b2d''2e''2 | d''2c''2b2
% PHRASE_BREAK
a2 | d''2a2bc''b2 | a2g6 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":d | l_1 :s_1 | d :r | m :m | r :m | s :f | m :r | d :— | — || :s.f | m :s | l :s | f :m | r :s | r :m.f | m :r | d :— | — || d | d ||","alto":":s_1 | f_1 :r_1 | s_1 :s_1 | s_1 :s_1 | s_1 :s_1 | s_1 :l_1 | s_1 :t_1 | d :— | — || :s_1 | s_1 :d | d :d | t_1 :d | t_1 :s_1 | l_1 :s_1.f_1 | s_1 :t_1 | d :— | — || l_1 | s_1 ||","tenor":":m | d :t_1 | d :t_1 | d :d | t_1 :d | d :d | d :f | m :— | — || :r | d :m | f :s | s :s | s :d | d :d | d :f | m :— | — || f | m ||","bass":":d_1 | f_1 :f_1 | m_1 :r_1 | d_1 :m_1 | s_1 :d | m_1 :f_1 | s_1 :s_1 | d :— | — || :t_1 | d :d | f :m | r :d | s_1 :m_1 | f_1 :m_1.r_1 | s_1 :s_1 | d :— | — || f_1 | d_1 ||"}', 'X:1
T:Gräfenberg
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2e2d2g2 | a2b2b2a2 | b2d''2c''2b2 | a2g6 | d''c''b2d''2e''2 | d''2c''2b2a2 | d''2a2bc''b2 | a2g6 | g2g2
[V:2] d2c2A2d2 | d2d2d2d2 | d2d2e2d2 | f2g6 | d2d2g2g2 | g2f2g2f2 | d2e2dcd2 | f2g6 | e2d2
[V:3] b2g2f2g2 | f2g2g2f2 | g2g2g2g2 | c''2b6 | a2g2b2c''2 | d''2d''2d''2d''2 | g2g2g2g2 | c''2b6 | c''2b2
[V:4] G2c2c2B2 | A2G2B2d2 | g2B2c2d2 | d2g6 | f2g2g2c''2 | b2a2g2d2 | B2c2BAd2 | d2g6 | c2G2', NULL, NULL, NULL, 'https://soundcloud.com/connorq/psalm-15-tune-grafenberg-smv', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Gräfenberg
M:C
L:1/8
Q:1/4=76
K:G
g2e2d2g2 | a2b2b2a2
% PHRASE_BREAK
 | b2d''2c''2b2 | a2g6
% PHRASE_BREAK
 |
d''c''b2d''2e''2 | d''2c''2b2
% PHRASE_BREAK
a2 | d''2a2bc''b2 | a2g6 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (34, 'recCJL3Ld6RSmOJ3r', 'St. Peter', 'CM', 'X:1
T:St. Peter
M:C
L:1/8
Q:1/4=76
K:Eb
_g2=b2_b2a2 | _g2_g2=e2_e2
% PHRASE_BREAK
 | e2_d2=B2=e2 |
e2_d6
% PHRASE_BREAK
 | e2=e2_e2a2 | _g2_g2=e2_e2
% PHRASE_BREAK
 | =B2e2_d2=B2 | B2=B6
', NULL, '{"doh":"Eb","time":"C","soprano":":s |d'' :t |l :s |s :f |m :m |r :d |f :m |r :— |— || :m |f :m |l :s |s :f |m :d |m :r |d :t_1 |d :— |— || d | d","alto":":d |m :m |d :d |r :t_1 |d :d |l_1 :s_1 |t_1 :d |t_1 :— |— || :d |d :d |d :d |d :t_1 |d :l_1 |d :l_1 |s_1 :s_1 |s_1 :— |— || l_1 | s_1","tenor":":m |s :s |f :s |s :s |s :s |f :s |s :s |s :— |— || :s |f :s |f :s |l :s |d :m |s :f |m :r |m :— |— || f | m","bass":":d |d :m |f :m |t_1 :s_1 |d :d |f :m |r :d |s_1 :— |— || :d.ta_1 |l_1 :d |f :m |r :s_1 |l_1 :l_1 |m_1 :f_1 |s_1 :s_1 |d :— |— || f_1 | d"}', 'X:1
T:St. Peter
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2=b2_b2a2 | _g2_g2=e2_e2 | e2_d2=B2=e2 | e2_d6 | e2=e2_e2a2 | _g2_g2=e2_e2 | =B2e2_d2=B2 | B2=B6
[V:2] =B2e2e2=B2 | =B2_d2_B2=B2 | =B2A2_G2_B2 | =B2_B6 | =B2=B2=B2=B2 | =B2=B2_B2=B2 | A2=B2A2_G2 | _G2_G6
[V:3] e2_g2_g2=e2 | _g2_g2_g2_g2 | _g2=e2_g2_g2 | _g2_g6 | _g2=e2_g2=e2 | _g2a2_g2=B2 | e2_g2=e2_e2 | _d2e6
[V:4] =B2=B2e2=e2 | e2B2_G2=B2 | =B2=e2_e2_d2 | =B2_G6 | =B=A_A2=B2=e2 | e2_d2_G2A2 | A2E2=E2_G2 | _G2=B6', NULL, NULL, NULL, 'https://youtu.be/rhSWZX74goY?si=bUMzveABYPBxUmz5', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Peter
M:C
L:1/8
Q:1/4=76
K:Eb
_g2=b2_b2a2 | _g2_g2=e2_e2
% PHRASE_BREAK
 | e2_d2=B2=e2 |
e2_d6
% PHRASE_BREAK
 | e2=e2_e2a2 | _g2_g2=e2_e2
% PHRASE_BREAK
 | =B2e2_d2=B2 | B2=B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (45, 'recHj8Fy5HTQPsweY', 'Stroudwater', 'CM', 'X:1
T:Stroudwater
M:C
L:1/8
Q:1/4=76
K:A
a2e4a2 | e''4c''2d''2 | c''2b2
% PHRASE_BREAK
a4 | a2b4c''2 | d''4c''2
% PHRASE_BREAK
b4 |
c''2b4a2 | e4g2a4 | b2
% PHRASE_BREAK
e''4e''d'' | c''2b2a2d''2 | c''2b2a4 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":d | s_1 :—:d | s :—:m | f :m :r | d :—:d | r :—:m | f :—:m | r :— || :m | r :—:d | s_1 :—:t_1 | d :—:r | s :—:s.f | m :r :d | f :m :r | d :— || d | d ||","alto":":s_1 | s_1 :—:l_1 | t_1 :—:s_1 | l_1 :s_1 :s_1.f_1 | m_1 :—:s_1 | s_1 :—:s_1 | l_1 :—:s_1 | s_1 :— || :s_1 | s_1 :f_1 :m_1 | s_1 :—:s_1 | s_1 :—:fe_1 | s_1 :—:s_1 | s_1 :-.f_1 :m_1 | l_1 :s_1 :s_1.f_1 | m_1 :— || f_1 | m_1 ||","tenor":":m | r :—:d | r :—:d | d :—:t_1 | d :—:m | t_1 :—:d | d :—:d | t_1 :— || :d | t_1 :—:d | d :—:r | m :r :d | t_1 :—:t_1 | d :t_1 :d | d :—:t_1 | d :— || l_1 | s_1 ||","bass":":d | t_1 :—:l_1 | s_1 :—:d | f_1 :s_1 :s_1 | d_1 :—:d | s_1 :—:d | f_1 :—:d_1 | s_1 :— || :d | s_1 :—:l_1 | m_1 :—:s_1 | d :t_1 :l_1 | s_1 :—:s_1 | d :s_1 :l_1 | f_1 :s_1 :s_1 | d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Stroudwater
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2e4a2 | e''4c''2d''2 | c''2b2a4 | a2b4c''2 | d''4c''2b4 | c''2b4a2 | e4g2a4 | b2e''4e''d'' | c''2b2a2d''2 | c''2b2a4 | a2a2
[V:2] e2e4f2 | g4e2f2 | e2edc4 | e2e4e2 | f4e2e4 | e2e2d2c2 | e4e2e4 | ^d2e4e2 | e3dc2f2 | e2edc4 | d2c2
[V:3] c''2b4a2 | b4a2a4 | g2a4c''2 | g4a2a4 | a2g4a2 | g4a2a4 | b2c''2b2a2 | g4g2a2 | g2a2a4 | g2a4f2 | e2
[V:4] a2g4f2 | e4a2d2 | e2e2A4 | a2e4a2 | d4A2e4 | a2e4f2 | c4e2a2 | g2f2e4 | e2a2e2f2 | d2e2e2A4 | d2A2', NULL, NULL, NULL, 'https://youtu.be/1_bK4g39Qk4?si=TSQFV6gp-vS6g_cV', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Stroudwater
M:C
L:1/8
Q:1/4=76
K:A
a2e4a2 | e''4c''2d''2 | c''2b2
% PHRASE_BREAK
a4 | a2b4c''2 | d''4c''2
% PHRASE_BREAK
b4 |
c''2b4a2 | e4g2a4 | b2
% PHRASE_BREAK
e''4e''d'' | c''2b2a2d''2 | c''2b2a4 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (63, 'recNxTvvkgc9SibRw', 'St. Mary', 'CM', 'X:1
T:St. Mary
M:C
L:1/8
Q:1/4=76
K:Dm
d2f2e2d2 | d''2c''2b2a2
% PHRASE_BREAK
 | a2c''2f2a2 | g2f6
% PHRASE_BREAK
 |
a2c''2d''2e''2 | a2g2f2c''2
% PHRASE_BREAK
 | g2a2d2f2 | e2d6 | z2
', NULL, '{"doh":"F","time":"C","soprano":":l_1 |d :t_1 |l_1 :l |s :f |m :m |s :d |m :r |d :—|—|| :m |s :l |t :m |r :d |s :r |m :l_1 |d :t_1 |l_1 :—|—||l_1 l_1||","alto":":l_1 |l_1 :s_1 |f_1 :d |d :l_1 |l_1 :s_1 |s_1 :l_1 |d :t_1 |d :—|—|| :d |r :d |t_1 :d |s_1 :d |t_1 :s_1 |s_1 :l_1 |l_1 :se_1 |l_1 :—|—||f_1 m_1||","tenor":":d |m :m |d :f |m :r |d :d |r :m |s :-.f |m :—|—|| :s |s :-.fe |s :s |r :m.fe |s :t_1 |d :d.r |m :m.r |d :—|—||r de||","bass":":l_1 |l_1 :m_1 |f_1 :f_1 |d :r |l_1 :d |t_1 :l_1 |m_1.f_1 :s_1 |d :—|—|| :d |t_1 :l_1 |s_1 :d |t_1 :l_1 |s_1 :s_1 |d :f_1 |m_1 :m_1 |l_1 :—|—||r_1 l_1||","lah":"D","mode":"minor"}', 'X:1
T:St. Mary
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Dm
[V:1] d2f2e2d2 | d''2c''2b2a2 | a2c''2f2a2 | g2f6 | a2c''2d''2e''2 | a2g2f2c''2 | g2a2d2f2 | e2d6 | z2
[V:2] d2d2c2B2 | f2f2d2d2 | c2c2d2f2 | e2f6 | f2g2f2e2 | f2c2f2e2 | c2c2d2d2 | _d2=d6 | z2
[V:3] f2a2a2f2 | b2a2g2f2 | f2g2a2c''3 | ba6c''2 | c''3=bc''2c''2 | g2a=bc''2e2 | f2fga2ag | f6z2
[V:4] d2d2A2B2 | B2f2g2d2 | f2e2d2AB | c2f6 | f2e2d2c2 | f2e2d2c2 | c2f2B2A2 | A2d6 | z2', NULL, NULL, NULL, NULL, 'no good version', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Mary
M:C
L:1/8
Q:1/4=76
K:Dm
d2f2e2d2 | d''2c''2b2a2
% PHRASE_BREAK
 | a2c''2f2a2 | g2f6
% PHRASE_BREAK
 |
a2c''2d''2e''2 | a2g2f2c''2
% PHRASE_BREAK
 | g2a2d2f2 | e2d6 | z2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (61, 'recN4QzCUfX8cGrlc', 'St. Andrew', 'CM', 'X:1
T:St. Andrew
M:C
L:1/8
K:A
a2c''4c''2 | b4c''2a4 | g2a4c''2 | e''4d''2cb | a2c''2b4 | e2a4b2 | c''4e''2d''4 | c''2b4b2 | c''4a2d''2 | c''2b2a4', NULL, '{"doh":"A","time":"C","soprano":":d | m :—:m | r :—:m | d :—:t_1 | d :—:m | s :—:f | m_1,r:d :m | r :— || :s_1 | d :—:r | m :—:s | f :— :m | r :—:r | m :—:d | f:m :r | d :— || d | d","alto":":s_1 | s_1:—:s_1 | s_1:—:s_1 | m_1:l_1 :s_1 | s_1:—:s_1 | t_1:—:s_1 | s_1 :—:s_1 | s_1:— || :s_1 | s_1:—:s_1 | s_1:—:s_1 | l_1 :— :s_1.l_1 | t_1:—:s_1 | s_1:—:m_1 | l_1.s_1:f_1 m_1:— || f_1 | m_1","tenor":":m | d :—:d | t_1:—:t_1 | d :f :r | m :—:d | r :—:r | m :—:m | t_1:— || :t_1 | d :—:t_1 | d :—:d | d :r :m.f | s :—:t_1 | d :—:d | d :—:t_1 | d :— || l_1 | s_1","bass":":d | d_1:—:m_1 | s_1:—:m_1 | l_1:f_1 :s_1 | d_1:—:d | s_1:—:t_1 | d_1,r:m :d | s_1:— || :s_1.f_1 | m_1:—:s_1 | d :—:m_1 | l_1 :t_1 :d | s_1:—:s_1 | m_1:—:l_1 | f_1:s_1 :s_1 | d_1:— || f_1 | d_1"}', 'X:1
T:St. Andrew
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2c''4c''2 | b4c''2a4 | g2a4c''2 | e''4d''2z2 | a2c''2b4 | e2a4b2 | c''4e''2d''4 | c''2b4b2 | c''4a2d''2 | c''2b2a4
[V:2] e2e4e2 | e4e2c2 | f2e2e4 | e2g4e2 | e4e2e4 | e2e4e2 | e4e2f4 | efg4e2 | e4c2fe | z4
[V:3] c''2a4a2 | g4g2a2 | d''2b2c''4 | a2b4b2 | c''4c''2g4 | g2a4g2 | a4a2a2 | b2c''d''e''4 | g2a4a2 | a4g2a4
[V:4] a2A4c2 | e4c2f2 | d2e2A4 | a2e4g2 | z2c''2a2e4 | edc4e2 | a4c2f2 | g2a2e4 | e2c4f2 | d2e2e2A4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=czQnHxP7XUY&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Andrew
M:C
L:1/8
Q:1/4=76
K:A
a2c''4c''2 | b4c''2a4 | g2a4
% PHRASE_BREAK
c''2 | e''4d''2z2 |
a2c''2b4
% PHRASE_BREAK
 | e2a4b2 | c''4e''2d''4 | c''2b4
% PHRASE_BREAK
b2 | c''4a2d''2 | c''2b2a4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (171, 'recznMkc12DfWdneM', 'Tallis', 'CM', 'X:1
T:Tallis
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2=e2_g2 | _g2a2a2_g2
% PHRASE_BREAK
 | _g2=b2_b2a2 | a2_g6
% PHRASE_BREAK
 |
=B2e2=e2_g2 | _g2a2a2_g2
% PHRASE_BREAK
 | =B2=e2_e2_d2 | _d2=B6 | =B2=B2
', NULL, '{"doh":"Eb","time":"C","soprano":":d |m :f |s :s |l :l |s :s |d'' :t |l :l |s :— |— || :d |m :f |s :s |l :l |s :d |f :m |r :r |d :— |— || d |d ||","alto":":d |d :d |t_1 :d |d :d |d :d |m :r |r :r |t_1 :— |— || :d |d :d |t_1 :d |d :d |d :d |d :d |d :t_1 |d :— |— || l_1 |s_1 ||","tenor":":m |s :f |r :m |f :f |m :m |s :s |s :fe |s :— |— || :m |s :f |r :m |f :f |m :m |l :s |s :s |m :— |— || f |m ||","bass":":d |d :l_1 |s_1 :d |f :f_1 |d :d |d :s_1 |r :r |s_1 :— |— || :d |d :l_1 |s_1 :d |f :f_1 |d :d |l_1 :d |s_1 :s_1 |d :— |— || f_1 |d ||"}', 'X:1
T:Tallis
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e2=e2_g2 | _g2a2a2_g2 | _g2=b2_b2a2 | a2_g6 | =B2e2=e2_g2 | _g2a2a2_g2 | =B2=e2_e2_d2 | _d2=B6 | =B2=B2
[V:2] =B2=B2=B2_B2 | =B2=B2=B2=B2 | =B2e2_d2_d2 | _d2B6 | =B2=B2=B2_B2 | =B2=B2=B2=B2 | =B2=B2=B2=B2 | B2=B6 | A2_G2
[V:3] e2_g2=e2_d2 | e2=e2=e2_e2 | e2_g2_g2_g2 | f2_g6 | e2_g2=e2_d2 | e2=e2=e2_e2 | e2a2_g2_g2 | _g2e6 | =e2_e2
[V:4] =B2=B2A2_G2 | =B2=e2=E2=B2 | =B2=B2_G2_d2 | _d2_G6 | =B2=B2A2_G2 | =B2=e2=E2=B2 | =B2A2=B2_G2 | _G2=B6 | =E2=B2', NULL, NULL, NULL, NULL, NULL, 'Use Edinburgh instead (almost identical)', false, false, NULL, NULL, NULL, false, 'X:1
T:Tallis
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2=e2_g2 | _g2a2a2_g2
% PHRASE_BREAK
 | _g2=b2_b2a2 | a2_g6
% PHRASE_BREAK
 |
=B2e2=e2_g2 | _g2a2a2_g2
% PHRASE_BREAK
 | =B2=e2_e2_d2 | _d2=B6 | =B2=B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (76, 'recTPyB7g9MY4rSIM', 'Sheffield', 'CM', 'X:1
T:Sheffield
M:C
L:1/8
Q:1/4=76
K:A
e2a2c''2b2 | d''2c''2b2a2
% PHRASE_BREAK
 | gabgfa
% PHRASE_BREAK
g2 | f2e6 |
c''d''e''2bc''
% PHRASE_BREAK
d''2 | abc''2bab2 | c''d''e''c''bd''c''2 | b2a6 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":s_1 |d :m |r :f |m :r |d :t_1.d |r.t_1:l_1.d |t_1 :l_1 |s_1 :— |— ||:m.f |s :r.m |f :d.r |m :r.d |r :m.f |s.m:r.f |m :r |d :— |— ||d |d ||","alto":":m_1 |s_1 :s_1 |l_1 :f_1 |s_1 :-.f_1 |m_1 :s_1 |s_1 :s_1 |s_1 :fe_1 |s_1 :— |— ||:s_1 |s_1.l_1:t_1 |f_1.s_1:l_1 |s_1 :fe_1 |s_1 :s_1.f_1 |m_1.s_1:l_1 |s_1 :s_1.f_1 |m_1 :— |— ||f_1 |m_1 ||","tenor":":d |d :d |l_1 :-.t_1 |d :t_1 |d :m |r :m |r :-.d |t_1 :— |— ||:d.r |m :t_1.d |r :l_1.t_1 |d :d |t_1 :d.t_1 |d :d |d :t_1 |d :— |— ||l_1 |s_1 ||","bass":":d_1 |m_1 :d_1 |f_1 :r_1 |m_1.f_1:s_1 |l_1 :m_1 |t_2 :d_1 |r_1 :r_1 |s_1 :— |— ||:d |m_1.f_1:s_1 |r_1.m_1:f_1 |d_1.m_1:l_1 |s_1.f_1:m_1.r_1 |d_1 :f_1 |s_1 :s_1 |d_1 :— |— ||f_1 |d_1 ||"}', 'X:1
T:Sheffield
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a2c''2b2 | d''2c''2b2a2 | gabgfag2 | f2e6 | c''d''e''2bc''d''2 | abc''2bab2 | c''d''e''c''bd''c''2 | b2a6 | a2a2
[V:2] c2e2e2f2 | d2e3dc2 | e2e2e2e2 | ^d2e6 | e2efg2de | f2e2^d2e2 | edcef2e2 | edc6 | d2c2
[V:3] a2a2a2f3 | ga2g2a2c''2 | b2c''2b3a | g6ab | c''2gab2fg | a2a2g2ag | a2a2a2g2 | a6f2 | e2
[V:4] A2c2A2d2 | B2cde2f2 | c2G2A2B2 | B2e6 | a2cde2Bc | d2Acf2ed | cBA2d2e2 | e2A6 | d2A2', NULL, NULL, NULL, 'https://youtu.be/b5wW3nKwL08?si=KIM5OzDApxOprIhO', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Sheffield
M:C
L:1/8
Q:1/4=76
K:A
e2a2c''2b2 | d''2c''2b2a2
% PHRASE_BREAK
 | gabgfa
% PHRASE_BREAK
g2 | f2e6 |
c''d''e''2bc''
% PHRASE_BREAK
d''2 | abc''2bab2 | c''d''e''c''bd''c''2 | b2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (73, 'recRqSzRhNJ1RHhO7', 'St. Kilda', 'CM', 'X:1
T:St. Kilda
M:C
L:1/8
Q:1/4=76
K:Em
e2e2f2g2 | b2a2g2f2
% PHRASE_BREAK
 | g2e2f2g2 | a2b6
% PHRASE_BREAK
 |
b2a2b2d''2 | b2a2g2f2
% PHRASE_BREAK
 | b2e2g2f2 | f2e6 | e2e2
', NULL, '{"doh":"G","time":"C","soprano":":l_1 |l_1 :t_1 |d :m |r :d |t_1 :d |l_1 :t_1 |d :r |m :— |— || :m |r :m |s :m |r :d |t_1 :m |l_1 :d |t_1 :t_1 |l_1 :— |— || l_1 | l_1 ||","alto":":m_1 |m_1 :s_1 |s_1 :s_1.d |t_1 :l_1 |se_1 :l_1 |l_1 :se_1 |l_1 :t_1 |d :— |— || :d |t_1 :d |r :d |t_1 :l_1 |se_1 :se_1 |l_1 :l_1 |l_1 :se_1 |l_1 :— |— || f_1 | m_1 ||","tenor":":d |d :r |m :s |s :m |m :m |m :m.r |m :s |s :— |— || :s |s :s |s :s |s :m |m :m |d :m |f :m.r |d :— |— || r | de ||","bass":":l_1 |l_1 :s_1 |d_1 :d |s_1 :l_1 |m_1 :l_1 |d :t_1 |l_1 :s_1 |d :— |— || :d |s_1 :d |t_1 :d |s_1 :l_1 |m_1 :m_1 |f_1 :d_1 |r_1 :m_1 |l_1 :— |— || r_1 | l_1 ||","lah":"E","mode":"minor"}', 'X:1
T:St. Kilda
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Em
[V:1] e2e2f2g2 | b2a2g2f2 | g2e2f2g2 | a2b6 | b2a2b2d''2 | b2a2g2f2 | b2e2g2f2 | f2e6 | e2e2
[V:2] B2B2d2d2 | dgf2e2^d2 | e2e2^d2e2 | f2g6 | g2f2g2a2 | g2f2e2^d2 | ^d2e2e2e2 | ^d2e6 | c2B2
[V:3] g2g2a2b2 | d''2d''2b2b2 | b2b2bab2 | d''2d''6 | d''2d''2d''2d''2 | d''2d''2b2b2 | b2g2b2c''2 | bag6 | a2^g2
[V:4] e2e2d2G2 | g2d2e2B2 | e2g2f2e2 | d2g6 | g2d2g2f2 | g2d2e2B2 | B2c2G2A2 | B2e6 | A2e2', NULL, NULL, NULL, 'https://youtu.be/Uy9G8j7205Y?si=SKFpYiKGHRUhiEpB', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Kilda
M:C
L:1/8
Q:1/4=76
K:Em
e2e2f2g2 | b2a2g2f2
% PHRASE_BREAK
 | g2e2f2g2 | a2b6
% PHRASE_BREAK
 |
b2a2b2d''2 | b2a2g2f2
% PHRASE_BREAK
 | b2e2g2f2 | f2e6 | e2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (148, 'recrqMEH4Pl8k0gvM', 'Harington', 'CM', 'X:1
T:Harington
M:C
L:1/8
K:Eb
_g2=b2_b2a2 | _g2=e2_e2=e2 | _g2a2a2_g2 | _g2_g2f2_g2 | ea_g2f2_g4 | _d_g_g2=e2_e2 | e2_d2=B2_de | =e2_e2a4 | _g=b=b2_b2=b2 | _de=e_e2_d2=B4', NULL, '{"doh":"Eb","time":"C","soprano":":s | d'':t :l | s:f :m | f:s :l | l:s :s | s:fe:s | m.l:s :fe | s:—|| :r.s | s:f:m | m:r:d | r.,m:f:m | l:—:s.d'' | d'':t:d'' | r.m,f:m:r | d:—||","alto":":d | d:— :d | d:t_1 :d | d:— :d | d:— :m | r:d :t_1 | m :r:d | t_1:—|| :t_1 | d:r:d | d:t_1:d | t_1.,d:r:d | d:—:d | f:—:m.d | r :d:t_1 | d:—||","tenor":":m | m:s :f | s:— :s | f:m :f | f:m :s | t:l :s | d'' :t :l | s:—|| :s | s:—:s | s:—:s | s :—:s | f:—:s | s:—:s | l :s:f | m:—||","bass":":d | d:— :d | m:r :d | l_1:s_1 :f_1 | d:— :d | r:— :m | d :r:r | s_1:—|| :s_1 | l_1:t_1:d.m | s:f:m | r.,d:t_1:d | f:—:m | r:—:d | f_1 :s_1:s_1 | d:—||"}', 'X:1
T:Harington
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] _g2=b2_b2a2 | _g2=e2_e2=e2 | _g2a2a2_g2 | _g2_g2f2_g2 | ea_g2f2_g4 | _d_g_g2=e2_e2 | e2_d2=B2_de | =e2_e2a4 | _g=b=b2_b2=b2 | _dze2_d2=B4
[V:2] =B2=B4=B2 | =B2_B2=B2=B4 | =B2=B4e2 | _d2=B2_B2e2 | _d2=B2_B4 | B2=B2_d2=B2 | =B2_B2=B2_B=B | _d2=B2=B4 | =B2=e4_e=B | _d2=B2_B2=B4
[V:3] e2e2_g2=e2 | _g4_g2=e2 | e2=e2=e2_e2 | _g2b2a2_g2 | =b2_b2a2_g4 | _g2_g4_g2 | _g4_g2_g4 | _g2=e4_g2 | _g4_g2a2 | _g2=e2_e4
[V:4] =B2=B4=B2 | e2_d2=B2A2 | _G2=E2=B4 | =B2_d4e2 | =B2_d2_d2_G4 | _G2A2B2=Be | _g2=e2_e2_d=B | B2=B2=e4 | e2_d4=B2 | =E2_G2_G2=B4', NULL, NULL, NULL, 'https://youtu.be/MyeCxkB75_s?si=ZEJCZQJsgI90IBrl', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Harington
M:C
L:1/8
Q:1/4=76
K:Eb
_g2=b2_b2a2 | _g2=e2_e2=e2
% PHRASE_BREAK
 | _g2a2a2_g2 | _g2_g2
% PHRASE_BREAK
f2_g2 |
ea_g2f2_g4 | _d
% PHRASE_BREAK
_g_g2=e2_e2 | e2_d2=B2_de | =e2_e2a4 | _g=b=b2_b2=b2 | _dze2_d2=B4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (102, 'recbKphyhsZyGn1fH', 'St. Paul', 'CM', 'X:1
T:St. Paul
M:C
L:1/8
Q:1/4=76
K:A
a2b2c''2e2 | a2b2g2a2
% PHRASE_BREAK
 | c''2b2e''2d''2 |
c''2b6
% PHRASE_BREAK
 | a2b2c''2d''2 | c''2b2a2g2
% PHRASE_BREAK
 | e2f2d''2c''2 | b2a6
', NULL, '{"doh":"A","time":"C","soprano":":d |r :m |s_1 :d |r :t_1 |d :m |r :s |f :m |r :— |—|| :d |r :m |f :m |r :d |t_1 :s_1 |l_1 :f |m :r |d :— |—||","alto":":m_1 |s_1 :s_1 |s_1 :l_1 |l_1 :s_1 |s_1 :s_1 |s_1 :s_1 |l_1 :s_1 |s_1 :— |—|| :m_1 |s_1 :s_1 |l_1 :s_1 |s_1 :fe_1 |s_1 :s_1 |f_1 :l_1 |s_1 :f_1 |m_1 :— |—||","tenor":":d |t_1 :d |r :m |f :r |m :d |t_1 :d |d :d |t_1 :— |—|| :d |t_1 :d |d :d |t_1 :d |r :d |d :d |d :t_1 |d :— |—||","bass":":d |s_1 :d |t_1 :l_1 |f_1 :s_1 |d_1 :d |s_1 :m_1 |f_1 :d |s_1 :— |—|| :d |s_1 :d_1 |f_1 :d |s_1 :l_1 |s_1 :m_1 |f_1 :r_1 |s_1 :s_1 |d_1 :— |—||"}', 'X:1
T:St. Paul
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2b2c''2e2 | a2b2g2a2 | c''2b2e''2d''2 | c''2b6 | a2b2c''2d''2 | c''2b2a2g2 | e2f2d''2c''2 | b2a6
[V:2] c2e2e2e2 | f2f2e2e2 | e2e2e2f2 | e2e6 | c2e2e2f2 | e2e2^d2e2 | e2d2f2e2 | d2c6
[V:3] a2g2a2b2 | c''2d''2b2c''2 | a2g2a2a2 | a2g6 | a2g2a2a2 | a2g2a2b2 | a2a2a2a2 | g2a6
[V:4] a2e2a2g2 | f2d2e2A2 | a2e2c2d2 | a2e6 | a2e2A2d2 | a2e2f2e2 | c2d2B2e2 | e2A6', NULL, NULL, NULL, 'https://youtu.be/xZ2kA4xf7ro?si=Va2fRNglfC6Fq0vZ', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Paul
M:C
L:1/8
Q:1/4=76
K:A
a2b2c''2e2 | a2b2g2a2
% PHRASE_BREAK
 | c''2b2e''2d''2 |
c''2b6
% PHRASE_BREAK
 | a2b2c''2d''2 | c''2b2a2g2
% PHRASE_BREAK
 | e2f2d''2c''2 | b2a6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (89, 'recWXAejcwqAADEUl', 'Gainsborough', 'CM', 'X:1
T:Gainsborough
M:C
L:1/8
Q:1/4=76
K:A
a2aba2e2 | abc''2
% PHRASE_BREAK
c''d''e''d'' | c''2b
% PHRASE_BREAK
ab4 | c''2e''d''c''2a2 |
b2
% PHRASE_BREAK
a2g2a4 | c''2e''4f''2 | e''d''c''2c''d''e''2 | d''2c''2b4 | e''2f''e''d''2c''2 | b2a2g2a4
', NULL, '{"doh":"A","time":"C","soprano":":d |d.,r:d :s_1 |d.,r:m :m.f |s.,f:m :r.d |r :—:m |s.,f:m :d |r :d :t_1 |d :—|| :m |s :—:l |s.,f:m :m.f |s :f :m |r :—:s |l.,s:f :m |r :d :t_1 |d :—||","alto":":s_1 |s_1 :—:s_1 |s_1 :—:s_1 |s_1 :—:d |t_1:—:d |d :—:d |l_1:s_1:s_1 |s_1:—|| :s_1 |d :s_1 :d |d :—:d |d :t_1 :d |t_1:—:d |d :r :d |l_1:s_1:s_1 |s_1:—||","tenor":":d |m.,f:m :r |m.,r:d :m |r :s :fe |s :—:s |m.,r:d :m |f :m :r |m :—|| :d |m :r :f |m.,f:s :s |s :—:s |s :—:s |f.,s:l :s |f :m :r |m :—||","bass":":d |d :—:t_1 |d :—:d |t_1 :d :l_1 |s_1:—:d |d :—:l_1 |f_1:s_1:s_1 |d :—|| :d |d :t_1 :l_1.t_1 |d :—:d.r |m :r :d |s_1:—:m_1 |f_1 :—:d |f_1:s_1:s_1 |d :—||"}', 'X:1
T:Gainsborough
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2aba2e2 | abc''2c''d''e''d'' | c''2bab4 | c''2e''d''c''2a2 | b2a2g2a4 | c''2e''4f''2 | e''d''c''2c''d''e''2 | d''2c''2b4 | e''2f''e''d''2c''2 | b2a2g2a4
[V:2] e2e4e2 | e4e2e4 | a2g4a2 | a4a2f2 | e2e2e4 | e2a2e2a2 | a4a2a2 | g2a2g4 | a2a2b2a2 | f2e2e2e4
[V:3] a2c''d''c''2b2 | c''ba2c''2b2 | e''2^d''2e''4 | e''2c''ba2c''2 | d''2c''2b2c''4 | a2c''2b2d''2 | c''d''e''2e''2e''4 | e''2e''4e''2 | d''e''f''2e''2d''2 | c''2b2c''4
[V:4] a2a4g2 | a4a2g2 | a2f2e4 | a2a4f2 | d2e2e2a4 | a2a2g2fg | a4abc''2 | b2a2e4 | c2d4a2 | d2e2e2a4', NULL, NULL, NULL, 'https://youtu.be/73DOOssXOqk?si=AYFKdX4bcoNHeaWW', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Gainsborough
M:C
L:1/8
Q:1/4=76
K:A
a2aba2e2 | abc''2
% PHRASE_BREAK
c''d''e''d'' | c''2b
% PHRASE_BREAK
ab4 | c''2e''d''c''2a2 |
b2
% PHRASE_BREAK
a2g2a4 | c''2e''4f''2 | e''d''c''2c''d''e''2 | d''2c''2b4 | e''2f''e''d''2c''2 | b2a2g2a4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (107, 'reccRsS586lS51E8v', 'Irish', 'CM', 'X:1
T:Irish
M:C
L:1/8
Q:1/4=76
K:F
f2f4c2 | f2g2a2b2 | a2
% PHRASE_BREAK
g2a4 | c''2a2b2c''2
% PHRASE_BREAK
 | f2g2e2f4 |
c''2f''2c''2d''2
% PHRASE_BREAK
 | c''2b2a2dc'' | b2a2g4 | c''2f''e''d''2c''2 | b2a2g2f4 | f2f2
', NULL, '{"doh":"F","time":"C","soprano":":d |d :—:s_1 |d :r :m |f :m :r |m :—:s |m :f :s |d :r :t_1 |d :—|| :s |d'' :s :l |s :f :m |l_1.,s:f :m |r :—:s |d''.,t:l :s |f :m :r |d :—||d |d||","alto":":s_1 |s_1 :—:s_1 |l_1 :t_1 :d |d :—:t_1 |d :—:r |d :—:d |l_1 :—:s_1 |s_1 :—|| :d |m_1.,r:d :d |d :t_1 :d |d :t_1 :d |t_1 :—:t_1 |d :—:d |r :d :t_1 |d :—||l_1 |s_1||","tenor":":m |m :—:r |m :s :s |l :s :s |s :—:s |s :l :s |m :f :r |m :—|| :m |s :—:f |s :—:s |f :s :s |s :—:r |s :f :m |l :s :f |m :—||f |m||","bass":":d |d :—:t_1 |l_1 :s_1 :d |f_1 :s_1 :s_1 |d :—:t_1 |d :l_1 :m_1 |l_1 :f_1 :s_1 |d :—|| :d |d_1.,r:m :f |m :r :d |f_1.,m:r :d |s_1 :—:s_1 |m_1 :f_1 :d |f_1 :s_1 :s_1 |d :—||f_1 |d||"}', 'X:1
T:Irish
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2f4c2 | f2g2a2b2 | a2g2a4 | c''2a2b2c''2 | f2g2e2f4 | c''2f''2c''2d''2 | c''2b2a2dc'' | b2a2g4 | c''2f''e''d''2c''2 | b2a2g2f4 | f2f2
[V:2] c2c4c2 | d2e2f2f4 | e2f4g2 | f4f2d4 | c2c4f2 | Agf2f2f2 | e2f2f2e2 | f2e4e2 | f4f2g2 | f2e2f4 | d2c2
[V:3] a2a4g2 | a2c''2c''2d''2 | c''2c''2c''4 | c''2c''2d''2c''2 | a2b2g2a4 | a2c''4b2 | c''4c''2b2 | c''2c''2c''4 | g2c''2b2a2 | d''2c''2b2a4 | b2a2
[V:4] f2f4e2 | d2c2f2B2 | c2c2f4 | e2f2d2A2 | d2B2c2f4 | f2Fga2b2 | a2g2f2Ba | g2f2c4 | c2A2B2f2 | B2c2c2f4 | B2f2', NULL, NULL, NULL, 'https://youtu.be/lSVYcyrhJHA?si=TZnla7-1hialfEfy', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Irish
M:C
L:1/8
Q:1/4=76
K:F
f2f4c2 | f2g2a2b2 | a2
% PHRASE_BREAK
g2a4 | c''2a2b2c''2
% PHRASE_BREAK
 | f2g2e2f4 |
c''2f''2c''2d''2
% PHRASE_BREAK
 | c''2b2a2dc'' | b2a2g4 | c''2f''e''d''2c''2 | b2a2g2f4 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (130, 'reckdEhoaQegQjEDM', 'Southwold', 'CM', 'X:1
T:Southwold
M:C
L:1/8
Q:1/4=76
K:F
a2a2c''2c''2 | b2b3ba2
% PHRASE_BREAK
 | a2g2f2d''2 |
b2g6
% PHRASE_BREAK
 | c''2c''2b2b2 | a2g2f2e2
% PHRASE_BREAK
 | b2a2c''2g2 | g2f6
', NULL, '{"doh":"F","time":"C","soprano":":m |m :s |s :f |f :-.f |m :m |r :d |l :f |r :— |—|| :s |s :f |f :m |r :d |t_1 :f |m :s |r :r |d :— |—||","alto":":d |d :r |d :d |d :t_1 |d :d |t_1 :d |d :r |t_1 :— |—|| :t_1 |m :r |r :d |l_1 :l_1 |s_1 :r |d :d |d :t_1 |d :— |—||","tenor":":s |s :s |l :l |s :s |s :s |f :m |f :l |s :— |—|| :s |l :l |s :s |f :m |r :s |s :s |s :s.f |m :— |—||","bass":":d |d :t_1 |l_1 :r |s_1 :s_1 |d :d |s_1 :l_1 |f_1 :f_1 |s_1 :— |—|| :m |d :r |t_1 :d |f_1 :f_1 |s_1 :t_1 |d :m_1 |s_1 :s_1 |d :— |—||"}', 'X:1
T:Southwold
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] a2a2c''2c''2 | b2b3ba2 | a2g2f2d''2 | b2g6 | c''2c''2b2b2 | a2g2f2e2 | b2a2c''2g2 | g2f6
[V:2] f2f2g2f2 | f2f2e2f2 | f2e2f2f2 | g2e6 | e2a2g2g2 | f2d2d2c2 | g2f2f2f2 | e2f6
[V:3] c''2c''2c''2d''2 | d''2c''2c''2c''2 | c''2b2a2b2 | d''2c''6 | c''2d''2d''2c''2 | c''2b2a2g2 | c''2c''2c''2c''2 | c''ba6
[V:4] f2f2e2d2 | g2c2c2f2 | f2c2d2B2 | B2c6 | a2f2g2e2 | f2B2B2c2 | e2f2A2c2 | c2f6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Southwold
M:C
L:1/8
Q:1/4=76
K:F
a2a2c''2c''2 | b2b3ba2
% PHRASE_BREAK
 | a2g2f2d''2 |
b2g6
% PHRASE_BREAK
 | c''2c''2b2b2 | a2g2f2e2
% PHRASE_BREAK
 | b2a2c''2g2 | g2f6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (28, 'rec8kbfCSC2G1nL8C', 'Orlington', 'CM', 'X:1
T:Orlington
M:C
L:1/8
Q:1/4=76
K:C
g2e2g2c''2 | e''2d''2c''2a4
% PHRASE_BREAK
 | b2c''4g2 | e2g2c''2
% PHRASE_BREAK
a2 | f''2d''2c''2b2 | g2ga
% PHRASE_BREAK
g2f2 |
f2e2c''2c''2 | b2a2a2g2 | g2c''4d''2 | e''4c''2f''4 | e''2d''4g2 | a2b2c''2d''2 | c''2b2c''4', NULL, '{"doh":"C","time":"C","soprano":":s |m :s :d'' |m'' :r'' :d'' |l :— :t |d'' :— :s |m :s :d'' |l :f'' :r'' |d'' :t :s |s .,l :s :f |f :m :d'' |d'' :t :l |l :s :s |d'' :— :r'' |m'' :— :d'' |f'' :— :m'' |r'' :— :s |l :t :d'' |r'' :d'' :t |d'' :—||","alto":":m |d :m :m |s :— :s |f :— :f |m :— :m |d :m :s |f :l :f |m :r :m |m .,f :m :r |r :d :l |l :s :f |f :m :s |s :— :s |s :— :l |l :— :s |s :— :s |f :s :s |f :m :r |m :—||","tenor":":s |s :— :s |d'' :t :d'' |d'' :r'' :r'' |d'' :— :d'' |d'' :— :d'' |d'' :— :l |s :— : |: : |: : |: : |: :m'' |m'' .,r'' :d'' :t |d'' :— :d'' |d'' :— :d'' |t :— :d'' |d'' :r'' :d'' |l :s :s |s :—||","bass":":d |d :— :d |d :r :m |f :r :s |d :— :d |d :— :m |f :— :f |s :— : |: : |: : |: : |: :d |d .,r :m :s |d'' :— :l |f :— :d |s :— :m |f .,m :r :m |f :s :s_1 |d :—||"}', 'X:1
T:Orlington
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2e2g2c''2 | e''2d''2c''2a4 | b2c''4g2 | e2g2c''2a2 | f''2d''2c''2b2 | g2gag2f2 | f2e2c''2c''2 | b2a2a2g2 | g2c''4d''2 | e''4c''2f''4 | e''2d''4g2 | a2b2c''2d''2 | c''2b2c''4
[V:2] e2c2e2e2 | g4g2f4 | f2e4e2 | c2e2g2f2 | a2f2e2d2 | e2efe2d2 | d2c2a2a2 | g2f2f2e2 | g2g4g2 | g4a2a4 | g2g4g2 | f2g2g2f2 | e2d2e4
[V:3] g2g4g2 | c''2b2c''2c''2 | d''2d''2c''4 | c''2c''4c''2 | c''4a2g4 | e''2e''d''c''2b2 | c''4c''2c''4 | c''2b4c''2 | c''2d''2c''2a2 | g2g2g4
[V:4] c2c4c2 | c2d2e2f2 | d2g2c4 | c2c4e2 | f4f2g4 | c2cde2g2 | c''4a2f4 | c2g4e2 | fed2e2f2 | g2G2c4', NULL, NULL, NULL, 'https://youtu.be/W-zY1ynjYTo?si=2h56qIxOfkNdhVQq', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Orlington
M:C
L:1/8
Q:1/4=76
K:C
g2e2g2c''2 | e''2d''2c''2a4
% PHRASE_BREAK
 | b2c''4g2 | e2g2c''2
% PHRASE_BREAK
a2 | f''2d''2c''2b2 | g2ga
% PHRASE_BREAK
g2f2 |
f2e2c''2c''2 | b2a2a2g2 | g2c''4d''2 | e''4c''2f''4 | e''2d''4g2 | a2b2c''2d''2 | c''2b2c''4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (119, 'recgk77xWWrtKljqH', 'Old 44th', 'CM', 'X:1
T:Old 44th
M:C
L:1/8
Q:1/4=76
K:Bb
B2B2A2B2 | G2F2F2B2
% PHRASE_BREAK
 | f2e2d2c2 | c2B6
% PHRASE_BREAK
 | B2A2B2G2 | F2F2B2d2
% PHRASE_BREAK
 | e2d2c2c2 | B6B2 |
B2c2d2e2 | f2e2d2c2 | B2G2A2B2 | c6B2 | F2G2A2B2 | c2d2c2B2 | A2B2c2c2 | B6B2 | B2', NULL, '{"doh":"Bb","time":"C","soprano":":d |d :t_1 |d :l_1 |s_1 :s_1 |d :s |f :m |r :r |d :—|— || d :t_1 |d :l_1 |s_1 :s_1 |d :m |f :m |r :r |d :—|— || :d |d :r |m :f |s :f |m :r |d :l_1 |t_1 :d |r :—|— || :d |s_1 :l_1 |t_1 :d |r :m |r :d |t_1 :d |r :r |d :—|— || d |d ||","alto":":s_1 |l_1 :s_1 |m_1 :f_1 |r_1 :r_1 |s_1 :m_1 |f_1 :s_1 |l_1 :s_1 |m_1 :—|— || l_1 :s_1 |m_1 :f_1 |r_1 :r_1 |s_1 :s_1 |l_1 :s_1 |s_1 :f_1 |m_1 :—|— || :m_1 |m_1 :s_1 |s_1 :l_1 |t_1 :t_1 |d :l_1 |s_1 :f_1 |f_1 :m_1 |s_1 :—|— || :s_1 |s_1 :f_1 |r_1 :m_1 |f_1 :s_1 |s_1 :m_1 |s_1 :s_1 |l_1 :s_1 |m_1 :—|— || f_1 |m_1 ||","tenor":":m |f :r |d :d |t_1 :t_1 |d :d |l_1 :d |d :t_1 |d :—|— || f :r |d :d |t_1 :t_1 |d :d |d :d |d :t_1 |d :—|— || :d |d :t_1 |d :d |r :r |d :f |m :d |r :d |t_1 :—|— || :m |d :d |s_1 :s_1 |l_1 :d |t_1 :d |r :d |d :t_1 |d :—|— || l_1 |s_1 ||","bass":":d_1 |f_1 :s_1 |l_1 :f_1 |s_1 :f_1 |m_1 :d_1 |r_1 :m_1 |f_1 :s_1 |d_1 :—|— || f_1 :s_1 |l_1 :f_1 |s_1 :f_1 |m_1 :d_1 |f_1 :d_1 |s_1 :s_1 |d_1 :—|— || :d |l_1 :s_1 |d :l_1 |s_1 :s_1 |l_1 :r_1 |m_1 :f_1 |r_1 :l_1 |s_1 :—|— || :d_1 |m_1 :f_1 |s_1 :m_1 |r_1 :d_1 |s_1 :l_1 |s_1 :m_1 |f_1 :s_1 |d_1 :—|— || f_1 |d_1 ||"}', 'X:1
T:Old 44th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] B2B2A2B2 | G2F2F2B2 | f2e2d2c2 | c2B6 | B2A2B2G2 | F2F2B2d2 | e2d2c2c2 | B6B2 | B2c2d2e2 | f2e2d2c2 | B2G2A2B2 | c6B2 | F2G2A2B2 | c2d2c2B2 | A2B2c2c2 | B6B2 | B2
[V:2] F2G2F2D2 | E2C2C2F2 | D2E2F2G2 | F2D6 | G2F2D2E2 | C2C2F2F2 | G2F2F2E2 | D6D2 | D2F2F2G2 | A2A2B2G2 | F2E2E2D2 | F6F2 | F2E2C2D2 | E2F2F2D2 | F2F2G2F2 | D6E2 | D2
[V:3] d2e2c2B2 | B2A2A2B2 | B2G2B2B2 | A2B6 | e2c2B2B2 | A2A2B2B2 | B2B2B2A2 | B6B2 | B2A2B2B2 | c2c2B2e2 | d2B2c2B2 | A6d2 | B2B2F2F2 | G2B2A2B2 | c2B2B2A2 | B6G2 | F2
[V:4] B,2E2F2G2 | E2F2E2D2 | B,2C2D2E2 | F2B,6 | E2F2G2E2 | F2E2D2B,2 | E2B,2F2F2 | B,6B2 | G2F2B2G2 | F2F2G2C2 | D2E2C2G2 | F6B,2 | D2E2F2D2 | C2B,2F2G2 | F2D2E2F2 | B,6E2 | B,2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=Q4btWuJAi2o&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Old 44th
M:C
L:1/8
Q:1/4=76
K:Bb
B2B2A2B2 | G2F2F2B2
% PHRASE_BREAK
 | f2e2d2c2 | c2B6
% PHRASE_BREAK
 | B2A2B2G2 | F2F2B2d2
% PHRASE_BREAK
 | e2d2c2c2 | B6B2 |
B2c2d2e2 | f2e2d2c2 | B2G2A2B2 | c6B2 | F2G2A2B2 | c2d2c2B2 | A2B2c2c2 | B6B2 | B2', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (112, 'rece8cdlmuB9Gpgaa', 'Palestrina (Mr Calendar tune)', 'CM', 'X:1
T:Palestrina (Mr Calendar tune)
M:C
L:1/8
Q:1/4=76
K:F
c''2c''2c''2d''4 | c''2c''2b2a2
% PHRASE_BREAK
 | c''6a2 | a2a2a2g2
% PHRASE_BREAK
 |
f2g6 | a2c''2c''2d''4 | a2c''2
% PHRASE_BREAK
b2b2 | a6a2 | g2f2g4 | g2a6
', NULL, '{"doh":"F","time":"C","soprano":"s :s :s | l :— :s | s :f :m | s :— :— | m :m :m | m :r :d | r :— :— || m :s :s | l :— :m | s :f :f | m :— :— | m :r :d | r :— :r | m :— :— || f | m","alto":"d :d :d | d :— :m | m :r :d | t_1 :— :— | d :d :d | d :l_1 :l_1 | t_1 :— :— || d :d :d | d :— :d | d :t_1 :t_1 | d :— :— | d :l_1 :l_1 | t_1 :— :t_1 | d :— :— || d | d","tenor":"m :m :m | f :— :s | s :— :s | s :— :— | s :s :s | s :f :m | s :— :— || s :m :m | f :— :s | m :r :r | d :— :— | s :f :m | s :— :s | s :— :— || l | s","bass":"d :d :d | f :— :d | d :t_1 :d | s :— :— | d :d :d | d :r :l_1 | s_1 :— :— || d :d :d | f :— :d | s_1 :— :s_1 | l_1 :— :— | d :r :l_1 | s_1 :— :s_1 | d :— :— || f_1 | d"}', 'X:1
T:Palestrina (Mr Calendar tune)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] c''2c''2c''2d''4 | c''2c''2b2a2 | c''6a2 | a2a2a2g2 | f2g6 | a2c''2c''2d''4 | a2c''2b2b2 | a6a2 | g2f2g4 | g2a6
[V:2] f2f2f2f4 | a2a2g2f2 | e6f2 | f2f2f2d2 | d2e6 | f2f2f2f4 | f2f2e2e2 | f6f2 | d2d2e4 | e2f6
[V:3] a2a2a2b4 | c''2c''4c''2 | c''6c''2 | c''2c''2c''2b2 | a2c''6 | c''2a2a2b4 | c''2a2g2g2 | f6c''2 | b2a2c''4 | c''2c''6
[V:4] f2f2f2b4 | f2f2e2f2 | c''6f2 | f2f2f2g2 | d2c6 | f2f2f2b4 | f2c4c2 | d6f2 | g2d2c4 | c2f6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=_Vif_Q27nBY&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Palestrina (Mr Calendar tune)
M:C
L:1/8
Q:1/4=76
K:F
c''2c''2c''2d''4 | c''2c''2b2a2
% PHRASE_BREAK
 | c''6a2 | a2a2a2g2
% PHRASE_BREAK
 |
f2g6 | a2c''2c''2d''4 | a2c''2
% PHRASE_BREAK
b2b2 | a6a2 | g2f2g4 | g2a6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (159, 'recvAV5VS4E1ZLkrn', 'Eden (NB 1st note 2nd line!)', 'CM', 'X:1
T:Eden (NB 1st note 2nd line!)
M:C
L:1/8
Q:1/4=76
K:A
a2c''2b2a2 | g2a2f2e2
% PHRASE_BREAK
 | f2a2g2f2 | =f2^f6
% PHRASE_BREAK
 |
a2a2g2a2 | b2c''2d''2e''2
% PHRASE_BREAK
 | a2c''2b2a2 | g2a6 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":d |m :r |d :t_1 |d :l_1 |s_1 :l_1 |d :t_1 |l_1 :se_1 |l_1 :— |— || :d |d :t_1 |d :r |m :f |s :d |m :r |d :t_1 |d :— |— || d |d ||","alto":":m_1 |s_1 :f_1 |m_1 :f_1 |s_1 :f_1 |r_1 :f_1 |s_1 :f_1 |m_1 :m_1 |m_1 :— |— || :s_1 |s_1 :s_1 |s_1 :s_1 |s_1 :d |t_1 :m_1 |s_1 :l_1 |s_1 :s_1 |s_1 :— |— || l_1 |s_1 ||","tenor":":s_1 |s_1 :s_1 |s_1 :r |d :d |t_1 :d |m :r |d :t_1 |d :— |— || :m |s :f |m :r |d :d |r :d |d :f |m :r |m :— |— || f |m ||","bass":":d_1 |d_1 :t_2 |d_1 :r_1 |m_1 :f_1 |s_1 :f_1 |d_1 :r_1 |m_1 :m_1 |l_1 :— |— || :d |m :r |d :t_1 |d :l_1 |s_1 :l_1 |m_1 :f_1 |s_1 :s_1 |d_1 :— |— || f_1 |d_1 ||"}', 'X:1
T:Eden (NB 1st note 2nd line!)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2c''2b2a2 | g2a2f2e2 | f2a2g2f2 | =f2^f6 | a2a2g2a2 | b2c''2d''2e''2 | a2c''2b2a2 | g2a6 | a2a2
[V:2] c2e2d2c2 | d2e2d2B2 | d2e2d2c2 | c2c6 | e2e2e2e2 | e2e2a2g2 | c2e2f2e2 | e2e6 | f2e2
[V:3] e2e2e2e2 | b2a2a2g2 | a2c''2b2a2 | g2a6 | c''2e''2d''2c''2 | b2a2a2b2 | a2a2d''2c''2 | b2c''6 | d''2c''2
[V:4] A2A2G2A2 | B2c2d2e2 | d2A2B2c2 | c2f6 | a2c''2b2a2 | g2a2f2e2 | f2c2d2e2 | e2A6 | d2A2', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=G0pHVkcnPCs&ab_channel=WestminsterCovenanter', 'solo recording', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Eden (NB 1st note 2nd line!)
M:C
L:1/8
Q:1/4=76
K:A
a2c''2b2a2 | g2a2f2e2
% PHRASE_BREAK
 | f2a2g2f2 | =f2^f6
% PHRASE_BREAK
 |
a2a2g2a2 | b2c''2d''2e''2
% PHRASE_BREAK
 | a2c''2b2a2 | g2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (153, 'rect8ax7ICCXjsjAC', 'Lloyd', 'CM', 'X:1
T:Lloyd
M:C
L:1/8
Q:1/4=76
K:F
a2abc''3f | e2g2f4
% PHRASE_BREAK
 | a2bc''d''2g2 |
g4
% PHRASE_BREAK
e''2d''c'' | f''3c''b2c''2 | a4
% PHRASE_BREAK
c''2bg | d2e2f4
', NULL, '{"doh":"F","time":"C","soprano":"m :m.f | s :-.d | t_1 :r | d :- | m :f.s | l :r | r :-|| t :l.s | d'' :-.s | f :s | m :- | s :f.r | l_1 :t_1 | d :-||","alto":"d :d.d | d :-.s_1 | s_1 :s_1 | s_1 :- | d :d.d | d :d | t_1 :-|| r :r.r | d :-.d | d :r | d :- | ta_1:l_1.l_1 | f_1.m_1:s_1 | s_1 :-||","tenor":"s :s.f | m :-.m | r :f | m :- | s :s.s | f :l | s :-|| s :s.s | s :-.s | l :s | s :- | d :d.r | r :r.f | m :-||","bass":"d :d.l_1 | s_1 :-.s_1 | s_1 :s_1 | d :- | d :r.m | f :fe | s :-|| s :f.f | m :-.m | r :t_1 | d :- | m_1 :f_1.f_1 | f_1 :s_1 | d :-||"}', 'X:1
T:Lloyd
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] a2abc''3f | e2g2f4 | a2bc''d''2g2 | g4e''2d''c'' | f''3c''b2c''2 | a4c''2bg | d2e2f4
[V:2] f2fff3c | c2c2c4 | f2fff2f2 | e4g2gg | f3ff2g2 | f4_e2dd | BAc2c4
[V:3] c''2c''ba3a | g2b2a4 | c''2c''c''b2d''2 | c''4c''2c''c'' | c''3c''d''2c''2 | c''4f2fg | g2gba4
[V:4] f2fdc3c | c2c2f4 | f2gab2=b2 | c''4c''2bb | a3ag2e2 | f4A2BB | B2c2f4', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=B8oi1jmIPhU&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Lloyd
M:C
L:1/8
Q:1/4=76
K:F
a2abc''3f | e2g2f4
% PHRASE_BREAK
 | a2bc''d''2g2 |
g4
% PHRASE_BREAK
e''2d''c'' | f''3c''b2c''2 | a4
% PHRASE_BREAK
c''2bg | d2e2f4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (168, 'recyLanFlGEMjJ9om', 'St. Flavian', 'CM', 'X:1
T:St. Flavian
M:C
L:1/8
Q:1/4=76
K:F
f2f2e2f2 | a2g2g2f2
% PHRASE_BREAK
 | f2b2a2f2 | g2a6
% PHRASE_BREAK
 |
a2a2b2c''2 | a2f2g2a2
% PHRASE_BREAK
 | a2g2f2f2 | e2f6 | f2f2
', NULL, '{"doh":"F","time":"C","soprano":":d |d :t_1 |d :m |r :r |d :d |f :m |d :r |m :— |—|| :m |m :f |s :m |d :r |m :m |r :d |d :t_1 |d :— |—|| d |d ||","alto":":s_1 |s_1 :s_1 |s_1 :d |d :t_1 |d :d |d :d |d :l_1 |t_1 :— |—|| :d |d :d |t_1 :t_1 |l_1 :t_1 |d :d |t_1 :l_1 |l_1 :s_1 |s_1 :— |—|| l_1 |s_1 ||","tenor":":m |r :r |m :l |l :s |m :m |f :s |l :l |se :— |—|| :s |s :f |r :m |m :s |s :s |s :m |r :r |m :— |—|| f |m ||","bass":":d |s_1 :s_1 |d :l_1 |f_1 :s_1 |d :d |l_1 :d |f :f |m :— |—|| :d |d :l_1 |s_1 :s_1 |l_1 :s_1 |d :d |s_1 :l_1 |f_1 :s_1 |d_1 :— |—|| f_1 |d_1 ||"}', 'X:1
T:St. Flavian
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] f2f2e2f2 | a2g2g2f2 | f2b2a2f2 | g2a6 | a2a2b2c''2 | a2f2g2a2 | a2g2f2f2 | e2f6 | f2f2
[V:2] c2c2c2c2 | f2f2e2f2 | f2f2f2f2 | d2e6 | f2f2f2e2 | e2d2e2f2 | f2e2d2d2 | c2c6 | d2c2
[V:3] a2g2g2a2 | d''2d''2c''2a2 | a2b2c''2d''2 | d''2_d''6 | c''2c''2b2g2 | a2a2c''2c''2 | c''2c''2a2g2 | g2a6 | b2a2
[V:4] f2c2c2f2 | d2B2c2f2 | f2d2f2b2 | b2a6 | f2f2d2c2 | c2d2c2f2 | f2c2d2B2 | c2F6 | B2F2', NULL, NULL, NULL, 'https://youtu.be/ZQKiKWKFj98?si=ysFfqbid-aEnjhSe', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Flavian
M:C
L:1/8
Q:1/4=76
K:F
f2f2e2f2 | a2g2g2f2
% PHRASE_BREAK
 | f2b2a2f2 | g2a6
% PHRASE_BREAK
 |
a2a2b2c''2 | a2f2g2a2
% PHRASE_BREAK
 | a2g2f2f2 | e2f6 | f2f2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (58, 'recLB9BosDcKf4HJC', 'St. Stephen', 'CM', 'X:1
T:St. Stephen
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_g4=b2 | =b2_b2a2_g2 | =e2
% PHRASE_BREAK
_e2=e2_d2 | e2a4_g2
% PHRASE_BREAK
 | _g4f2_g4 |
_g2e2=e2a2 | _g4
% PHRASE_BREAK
_g2a2 | b2=b2=b2_b2 | _g2=b2e2_g2 | =e2_e2_d2=B4 | =B2=B2
', NULL, '{"doh":"Eb","time":"C","soprano":":d |s :—:d'' |d'' :t :l |s :f :m |m :r :m |l :—:s |s :—:fe |s :—|| :s |m :f :l |s :—:s |l :t :d'' |d'' :t :s |d'' :m :s |f :m :r |d :—|| d |d ||","alto":":d |d :—:d |r :—:r |s_1 :t_1 :d |d :t_1 :d |m :—:r |m :r :d |t_1 :—|| :r |d :—:d |d :t_1 :d |d :f :m |m :r :t_1 |d :—:d |d :—:t_1 |d :—|| l_1 |s_1 ||","tenor":":m |m :—:s |s :—:t |d'' :s :s |s :—:s |d'' :—:t |l :t :l |s :—|| :s |s :f :f |m :f :s |f :s :s |s :—:s |s :—:ta |l :s :f |m :—|| f |m ||","bass":":d |d :—:m |s :—:f |m :r :d |s_1 :—:d |l_1 :—:t_1 |d :r :r |s_1 :—|| :t_1 |d :l_1 :f_1 |d :r :m |f_1.,m :r :d |s_1 :—:s_1.f |m :d :m_1 |f_1 :s_1 :s_1 |d :—|| f_1 |d ||"}', 'X:1
T:St. Stephen
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2_g4=b2 | =b2_b2a2_g2 | =e2_e2=e2_d2 | e2a4_g2 | _g4f2_g4 | _g2e2=e2a2 | _g4_g2a2 | b2=b2=b2_b2 | _g2=b2e2_g2 | =e2_e2_d2=B4 | =B2=B2
[V:2] =B2=B4=B2 | _d4_d2_G2 | B2=B2=B2_B2 | =B2e4_d2 | e2_d2=B2_B4 | _d2=B4=B2 | =B2_B2=B2=B2 | =e2_e2=e2_d2 | B2=B4=B2 | =B4_B2=B4 | A2_G2
[V:3] e2e4_g2 | _g4b2=b2 | _g2_g2_g4 | _g2=b4_b2 | a2b2a2_g4 | _g2_g2=e2=e2 | e2=e2_g2=e2 | _g2_g2_g4 | _g2_g4=a2 | a2_g2=e2_e4 | =e2_e2
[V:4] =B2=B4e2 | _g4=e2_e2 | _d2=B2_G4 | =B2A4_B2 | =B2_d2_d2_G4 | B2=B2A2=E2 | =B2_d2e2=Ee | _d2=B2_G4 | _G=e_e2=B2E2 | =E2_G2_G2=B4 | =E2=B2', NULL, NULL, NULL, 'https://youtu.be/i-481_a8f6g?si=QFukByQFcCNQ3pA0', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:St. Stephen
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_g4=b2 | =b2_b2a2_g2 | =e2
% PHRASE_BREAK
_e2=e2_d2 | e2a4_g2
% PHRASE_BREAK
 | _g4f2_g4 |
_g2e2=e2a2 | _g4
% PHRASE_BREAK
_g2a2 | b2=b2=b2_b2 | _g2=b2e2_g2 | =e2_e2_d2=B4 | =B2=B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (21, 'rec6cnHg9bFL7Uxa8', 'Naomi', 'CM', 'X:1
T:Naomi
M:C
L:1/8
Q:1/4=76
K:Eb
e2ee_g2=e_e | _de
% PHRASE_BREAK
=e2_e2=e2 | a3a_g2
% PHRASE_BREAK
f2 |
_g4e2ee | _g2=e_e
% PHRASE_BREAK
_d=e=e2 | e2e2a3a | _ge_d2=B4
', NULL, '{"doh":"Eb","time":"C","soprano":"m :m.m | s :f.m | r.m:f | m :m | l :-.l | s :fe | s :— || m :m.m | s :f.m | r.m:f | m :m | l :-.l | s.m :r | d :—||","alto":"d :d.d | m :r.d | t_1.d:r | d :d | m :-.m | r :d | t_1 :— || d :d.d | m :r.d | t_1.d:r | d :d | d :-.d | d :t_1 | d :—||","tenor":"s :s.s | s :s | s :s | s :s | d'' :-.d'' | t :l | s :— || s :s.s | s :s | s :s | s :s | f :-.f | m.s :s.f | m :—||","bass":"d :d.d | d :d | s :s_1 | d :d | l_1 :-.l_1 | r :r | s_1 :— || d :d.d | d :d | s :s_1 | d :d | f_1 :-.f_1 | s_1 :s_1 | d :—||"}', 'X:1
T:Naomi
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] e2ee_g2=e_e | _de=e2_e2=e2 | a3a_g2f2 | _g4e2ee | _g2=e_e_d=e=e2 | e2e2a3a | _ge_d2=B4
[V:2] =B2=B=Be2_d=B | B=B_d2=B2=B2 | e3e_d2=B2 | B4=B2=B=B | e2_d=B_B=B_d2 | =B2=B2=B3=B | =B2_B2=B4
[V:3] _g2_g_g_g2_g2 | _g2_g2_g2_g2 | =b3=b_b2a2 | _g4_g2_g_g | _g2_g2_g2_g2 | _g2_g2=e3=e | e_g_g=e_e4
[V:4] =B2=B=B=B2=B2 | _g2_G2=B2=B2 | A3A_d2_d2 | _G4=B2=B=B | =B2=B2_g2_G2 | =B2=B2=E3=E | _G2_G2=B4', NULL, NULL, NULL, 'https://youtu.be/k37SkPojQ40?si=79a8rDr8f5E3VOUK', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Naomi
M:C
L:1/8
Q:1/4=76
K:Eb
e2ee_g2=e_e | _de
% PHRASE_BREAK
=e2_e2=e2 | a3a_g2
% PHRASE_BREAK
f2 |
_g4e2ee | _g2=e_e
% PHRASE_BREAK
_d=e=e2 | e2e2a3a | _ge_d2=B4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (166, 'recyAAzOWKwY9nfTZ', 'Ballerma (start high)', 'CM', 'X:1
T:Ballerma (start high)
M:C
L:1/8
Q:1/4=76
K:A
a2c''4b2 | a4f2e4 | f2a4
% PHRASE_BREAK
a2 | c''4b2c''2 | e''2c''2
% PHRASE_BREAK
b4 |
a2c''4b2 | a4f2e4 | c2
% PHRASE_BREAK
e4a2 | c''2e''2c''2b2 | c''2b2a4 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":d |m :—:r |d :—:l_1 |s_1 :—:l_1 |d :—:d |m :—:r |m :s :m |r :— || :d |m :—:r |d :—:l_1 |s_1 :—:m_1 |s_1 :—:d |m :s :m |r :m :r |d :— || d | d ||","alto":":m_1 |s_1 :—:f_1 |m_1 :—:f_1 |d_1 :—:d_1 |m_1 :—:m_1 |s_1 :—:s_1 |s_1 :—:s_1 |s_1 :— || :m_1 |s_1 :—:f_1 |m_1 :—:f_1 |d_1 :—:d_1 |r_1 :—:s_1 |s_1 :—:s_1 |l_1 :s_1 :f_1 |m_1 :— || f_1 | m_1 ||","tenor":":d |d :—:t_1 |d :—:d |d :—:l_1 |s_1 :—:s_1 |d :—:t_1 |d :m :d |t_1 :— || :d |d :—:t_1 |d :—:d |d :—:d |t_1 :—:d |d :m :d |d :—:t_1 |d :— || l_1 | s_1 ||","bass":":d_1 |d :—:s_1 |l_1 :s_1 :f_1 |m_1 :—:f_1 |d_1 :—:d_1 |d_1 :m_1 :s_1 |d :—:d_1 |s_1 :— || :d_1 |d :—:s_1 |l_1 :s_1 :f_1 |m_1 :—:l_1 |s_1 :—:m_1 |d_1 :—:d_1 |f_1 :s_1 :s_1 |d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Ballerma (start high)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] a2c''4b2 | a4f2e4 | f2a4a2 | c''4b2c''2 | e''2c''2b4 | a2c''4b2 | a4f2e4 | c2e4a2 | c''2e''2c''2b2 | c''2b2a4 | a2a2
[V:2] c2e4d2 | c4d2A4 | A2c4c2 | e4e2e4 | e2e4c2 | e4d2c4 | d2A4A2 | B4e2e4 | e2f2e2d2 | c4d2c2
[V:3] a2a4g2 | a4a2a4 | f2e4e2 | a4g2a2 | c''2a2g4 | a2a4g2 | a4a2a4 | a2g4a2 | a2c''2a2a4 | g2a4f2 | e2
[V:4] A2a4e2 | f2e2d2c4 | d2A4A2 | A2c2e2a4 | A2e4A2 | a4e2f2 | e2d2c4 | f2e4c2 | A4A2d2 | e2e2A4 | d2A2', NULL, NULL, NULL, 'https://youtu.be/67jbBYbcqao?si=tfMXvRfJpdHyz7mX', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Ballerma (start high)
M:C
L:1/8
Q:1/4=76
K:A
a2c''4b2 | a4f2e4 | f2a4
% PHRASE_BREAK
a2 | c''4b2c''2 | e''2c''2
% PHRASE_BREAK
b4 |
a2c''4b2 | a4f2e4 | c2
% PHRASE_BREAK
e4a2 | c''2e''2c''2b2 | c''2b2a4 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (149, 'recsKBrCxYYAUSJyD', 'Desert DONT SING', 'CM', 'X:1
T:Desert DONT SING
M:C
L:1/8
K:G
g2bc''dedc | Bcbgafg3 | bc''baga3 | ababc''d''e''d''2 | ^c''2d''4d''2 | d''d''bagbc''b | aga4d''c'' | c''c''b3baa | aad''3d''e''d'' | c''ba3ag4', NULL, '{"doh":"G","time":"C","soprano":"d :m .,f |s_1.l_1 .s_1,f_1:m_1 .f_1 |m .d :r .t_1 |d :— .m |f .m :r .d |r :— .r |m,r.m,f:s .l |s :fe |s :— ||s :s .s |m .,r :d .m |f .m :r .d |r :— . |s.f :f .f |m :— .m |r .r:r .r |s :— .s |l .s :f.m |r :—.r |d :—||","alto":"s_1 :d .,d |d :— .d |d .s_1 :s_1 |s_1 :— .d |t_1 .d :s_1 .d |t_1 :— .t_1 |d :— .d |t_1 :d |t_1 :— ||d :r .t_1 |d :— .d |d :t_1 .d |t_1 :— . |n.l_1 : .l_1 |s_1.s_1:s_1.d |t_1 :—.t_1 |d.t_1:d |— :t_1.d |d :t_1 |d :—||","tenor":"m :s .,f |m :— .l |s .m :f .r |m :— .s |s .s :s .fe |r :— .s |s :m .m |r :r |r :— ||m :r .s |s .,f :m .s |l .s :f .m |s :— . |b : |: .s |s .s:s .s |m.f :s .m |f .s :—.s |s :—.f |m :—||","bass":"d :d .,d |d :— .f_1 |s_1 :s_1 |d_1 :— .d |r .d :t_1 .l_1 |s_1 :— .s_1 |d :— .l_1 |r :r_1 |s_1 :— ||d :t_1 .s_1 |d .,r :d .m |f .m :r .d |s_1 :— .s_1 |d.r :m .d |l_1 :— .f_1 |s_1 :—.s_1 |d.r:m .d |f .m :r.d |s_1 :s_1 |d :—||"}', 'X:1
T:Desert DONT SING
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] g2bc''dezB | cbgafg3 | bc''baga3 | azzd''e''d''2^c''2 | d''4d''2d''d'' | bagbc''bag | a4d''c''c''c'' | b3baaaa | d''3d''e''d''c''b | a3ag4
[V:2] d2ggg3g | gdd2d3g | fgdgf3f | g3gf2g2 | f4g2af | g3gg2fg | f4zee2 | dddgf3f | gfg4fg | g2f2g4
[V:3] b2d''c''b3e'' | d''bc''ab3d'' | d''d''d''^c''a3d'' | d''2bba2a2 | a4b2ad'' | d''c''bd''e''d''c''b | d''4z2d''2 | d''d''d''d''bc''d''b | c''d''2d''d''3c'' | b4
[V:4] g2ggg3c | d2d2G3g | agfed3d | g3ea2A2 | d4g2fd | gagbc''bag | d3dgabg | e3cd3d | gabgc''bag | d2d2g4', NULL, NULL, NULL, NULL, NULL, 'Last line repeated 3 times!', false, false, NULL, NULL, NULL, true, 'X:1
T:Desert DONT SING
M:C
L:1/8
Q:1/4=76
K:G
g2bc''dezB | cb
% PHRASE_BREAK
gafg3 | bc''
% PHRASE_BREAK
baga3 | azzd''e''d''2
% PHRASE_BREAK
^c''2 |
d''4d''2d''d'' | bagbc''bag | a4d''c''c''c'' | b3baaaa | d''3d''e''d''c''b | a3ag4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (139, 'recogruIq6ySEqiEd', 'Evangel', 'CM', 'X:1
T:Evangel
M:C
L:1/8
Q:1/4=76
K:C
g2c''2c''2b2 | a2g3ag2
% PHRASE_BREAK
 | g2a2d''2c''2 | b2c''6
% PHRASE_BREAK
 | g2c''2c''2b2 | a2g3ag2
% PHRASE_BREAK
 | e''2d''2c''2b2 |
a2g6 | g2b2g2c''2 | g2d''2g2e''2 | c''2f''2e''2d''2 | c''2c''4b2 | g2c''2c''2b2 | a2g3ag2 | g2a2d''2c''2 | b2c''6', NULL, '{"doh":"C","time":"C","soprano":":s |d'' :d'' |t :l |s :-.l |s :s |l :r'' |d'' :t |d'' :— |— || :s |d'' :d'' |t :l |s :-.l |s :m'' |r'' :d'' |t :l |s :— |— || :s |t :s |d'' :s |r'' :s |m'' :d'' |f'' :m'' |r'' :d'' |d'' :— |t || :s |d'' :d'' |t :l |s :-.l |s :s |l :r'' |d'' :t |d'' :— |— ||","alto":":s |m :l |s :f |m :-.f |m :s |f :l |s :s |s :— |— || :s |m :s |s :f |m :-.f |m :m.fe |s :l |s :fe |s :— |— || :t_1 |r :t_1 |d :s |f :f |m :m |f :s |l :l |s :— |— || :f |m :l |s :f |m :f |m :m |f :l |s :f |m :— |— ||","tenor":":s |d'' :d'' |d'' :d'' |d'' :-.d'' |d'' :d'' |d'' :f'' |m'' :r'' |m'' :— |— || :s |d'' :d'' |d'' :d'' |d'' :-.d'' |d'' :s.l |t :m'' |r'' :d'' |t :— |— || :s |s :s |s :d'' |t :t |d'' :d'' |d'' :t |l :r'' |r'' :— |— || :t |d'' :d'' |d'' :d'' |d'' :t |d'' :d'' |d'' :f'' |m'' :r'' |d'' :— |— ||","bass":":s |d :d |d :d |d :-.d |d :m |f :r |s :s |d :— |— || :s |d :m |f :l |d'' :-.d |d :d |t_1 :d |r :r |s :— |— || :s |f :f |m :m |r :r |d :ta |l :s |f :fe |s :— |— || :s |d :d |d :d |d :r |m :d |f :r |s :s |d :— |— ||"}', 'X:1
T:Evangel
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] g2c''2c''2b2 | a2g3ag2 | g2a2d''2c''2 | b2c''6 | g2c''2c''2b2 | a2g3ag2 | e''2d''2c''2b2 | a2g6 | g2b2g2c''2 | g2d''2g2e''2 | c''2f''2e''2d''2 | c''2c''4b2 | g2c''2c''2b2 | a2g3ag2 | g2a2d''2c''2 | b2c''6
[V:2] g2e2a2g2 | f2e3fe2 | g2f2a2g2 | g2g6 | g2e2g2g2 | f2e3fe2 | e^fg2a2g2 | ^f2g6 | B2d2B2c2 | g2f2f2e2 | e2f2g2a2 | a2g6 | f2e2a2g2 | f2e2f2e2 | e2f2a2g2 | f2e6
[V:3] g2c''2c''2c''2 | c''2c''3c''c''2 | c''2c''2f''2e''2 | d''2e''6 | g2c''2c''2c''2 | c''2c''3c''c''2 | gab2e''2d''2 | c''2b6 | g2g2g2g2 | c''2b2b2c''2 | c''2c''2b2a2 | d''2d''6 | b2c''2c''2c''2 | c''2c''2b2c''2 | c''2c''2f''2e''2 | d''2c''6
[V:4] g2c2c2c2 | c2c3cc2 | e2f2d2g2 | g2c6 | g2c2e2f2 | a2c''3cc2 | c2B2c2d2 | d2g6 | g2f2f2e2 | e2d2d2c2 | ^a2=a2g2f2 | ^f2g6 | g2c2c2c2 | c2c2d2e2 | c2f2d2g2 | g2c6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Evangel
M:C
L:1/8
Q:1/4=76
K:C
g2c''2c''2b2 | a2g3ag2
% PHRASE_BREAK
 | g2a2d''2c''2 | b2c''6
% PHRASE_BREAK
 | g2c''2c''2b2 | a2g3ag2
% PHRASE_BREAK
 | e''2d''2c''2b2 |
a2g6 | g2b2g2c''2 | g2d''2g2e''2 | c''2f''2e''2d''2 | c''2c''4b2 | g2c''2c''2b2 | a2g3ag2 | g2a2d''2c''2 | b2c''6', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (20, 'rec6Zo38xdhumx1RD', 'Old 134th', 'SM', 'X:1
T:Old 134th
M:C
L:1/8
Q:1/4=76
K:A
e2a2c''2b2 | b2c''6
% PHRASE_BREAK
 | e''2d''2c''2b2 | b2a6
% PHRASE_BREAK
 |
a2g2f2e2 | a2a2b2c''2
% PHRASE_BREAK
 | c''2b2a2a2 | g2a6 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":s_1 |d :m |r :r |m :— |— :s |f :m |r :r |d :— |— || :d |t_1 :l_1 |s_1 :d |d :r |m :m |r :d |d :t_1 |d :— |— || d |d ||","alto":":s_1 |l_1 :s_1 |l_1 :s_1 |s_1 :— |— :s_1 |d :s_1 |l_1 :s_1.f_1 |m_1 :— |— || :l_1 |s_1 :f_1 |r_1 :s_1 |m_1 :l_1 |se_1 :s_1 |s_1 :m_1 |l_1 :s_1 |s_1 :— |— || l_1 |s_1 ||","tenor":":m |m :d |d :t_1 |d :— |— :r |d :d |d :t_1 |d :— |— || :m |m :d |t_1 :d |d :l_1 |t_1 :d |t_1 :d |r :r |m :— |— || f |m ||","bass":":d |l_1 :m_1 |f_1 :s_1 |d :— |— :t_1 |l_1 :m_1 |f_1 :s_1 |d_1 :— |— || :l_1 |m_1 :f_1 |s_1 :m_1 |l_1 :f_1 |m_1 :d_1 |s_1 :l_1 |f_1 :s_1 |d :— |— || f_1 |d_1 ||"}', 'X:1
T:Old 134th
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a2c''2b2 | b2c''6 | e''2d''2c''2b2 | b2a6 | a2g2f2e2 | a2a2b2c''2 | c''2b2a2a2 | g2a6 | a2a2
[V:2] e2f2e2f2 | e2e6 | e2a2e2f2 | edc6 | f2e2d2B2 | e2c2f2=f2 | e2e2c2f2 | e2e6 | f2e2
[V:3] c''2c''2a2a2 | g2a6 | b2a2a2a2 | g2a6 | c''2c''2a2g2 | a2a2f2g2 | a2g2a2b2 | b2c''6 | d''2c''2
[V:4] a2f2c2d2 | e2a6 | g2f2c2d2 | e2A6 | f2c2d2e2 | c2f2d2c2 | A2e2f2d2 | e2a6 | d2A2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Old 134th
M:C
L:1/8
Q:1/4=76
K:A
e2a2c''2b2 | b2c''6
% PHRASE_BREAK
 | e''2d''2c''2b2 | b2a6
% PHRASE_BREAK
 |
a2g2f2e2 | a2a2b2c''2
% PHRASE_BREAK
 | c''2b2a2a2 | g2a6 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (52, 'recJzYZ6jgMv0uj9t', 'Boswell', 'CM', 'X:1
T:Boswell
M:C
L:1/8
Q:1/4=76
K:D
a2a4a2 | f4g2a2 | f2b2 a4
w: I in the Lord do put _ my trust:
% PHRASE_BREAK
| a2g4e2 |
a4g2 f4
w: how is it then that ye
% PHRASE_BREAK
| a2d''4d''2 | d''2c''2c''2b4 b2 a4
w: Say to my soul, _ Flee, as a bird,
% PHRASE_BREAK
| a2 | d3ef2f4 | e2d4
w: un- to _ your moun- tain high?', NULL, '{"doh":"D","time":"C","soprano":":s |s :—:s |m :—:f |s:m :l |s :—:s |f :—:r |s :—:f |m :—|| :s |d'' :—:d'' |d'':t :t |l :—:l |s :—:s |d :-.r:m |m :—:r |d :—||","alto":":d |d :—:d |d :—:r |m:d :f |m :—:d |r :—:r |r :—:t_1 |d :—|| :d |d:m :d |r :—:r |r :—:d |t_1 :—:t_1 |d :-.t_1:d |d :—:t_1 |d :—||","tenor":":m |m :—:m |s :—:s |s :—:d'' |d'' :—:s |l :—:l |s :—:s |s :—|| :m |s :—:s |s :—:s |s:fe:fe |s :—:s |s :-.f:m |s :—:s.f |m :—||","bass":":d |d :—:d |d :—:d |d :—:d |d :—:m |r :—:d |t_1 :—:s_1 |d :—|| :d |m:d :m |s :—:s |r :—:r |s :—:f |m :-.r:d |s_1 :—:s_1 |d :—||"}', 'X:1
T:Boswell
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:D
[V:1] a2a4a2 | f4g2a2 | f2b2a4 | a2g4e2 | a4g2f4 | a2d''4d''2 | d''2c''2c''2b4 | b2a4a2 | d3ef2f4 | e2d4
[V:2] d2d4d2 | d4e2f2 | d2g2f4 | d2e4e2 | e4c2d4 | d2d2f2d2 | e4e2e4 | d2c4c2 | d3cd2d4 | c2d4
[V:3] f2f4f2 | a4a2a4 | d''2d''4a2 | b4b2a4 | a2a4f2 | a4a2a4 | a2a2^g2^g2 | a4a2a3 | gf2a4a | gf4
[V:4] d2d4d2 | d4d2d4 | d2d4f2 | e4d2c4 | A2d4d2 | f2d2f2a4 | a2e4e2 | a4g2f3 | ed2A4A2 | d4', NULL, NULL, NULL, 'https://youtu.be/7irYLvnTLwk?si=HlAUQe9Q-GbY9fTu', 'poor recording', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Boswell
M:C
L:1/8
Q:1/4=76
K:D
a2a4a2 | f4g2a2 | f2b2
% PHRASE_BREAK
a4 | a2g4e2 |
a4g2
% PHRASE_BREAK
f4 | a2d''4d''2 | d''2c''2c''2b4
% PHRASE_BREAK
 | b2a4a2 | d3ef2f4 | e2d4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (25, 'rec7msdzGad7nX3hT', 'Edinburgh', 'CM', 'X:1
T:Edinburgh
M:C
L:1/8
Q:1/4=76
K:E
e2b2b2g2 | e2c''2c''2b2
% PHRASE_BREAK
 | b2e''2e''2d''2 | c''2b6
% PHRASE_BREAK
 |
g2a2c''2b2 | e''2c''3ba2
% PHRASE_BREAK
 | g2f2a2g2 | f2e6 | e2e2
', NULL, '{"doh":"E","time":"C","soprano":":d |s :s |m :d |l :l |s :s |d'' :d'' |t :l |s :— |—|| :m |f :l |s :d'' |l :—.s |f :m |r :f |m :r |d :— |—|| d | d ||","alto":":d |r :t_1 |d :d |d :d |d :r |d :m |t_1 :r.d |t_1 :— |—|| :d |d :d |d :m |d :—.ta_1 |l_1 :d |d :d |d :t_1 |d :— |—|| l_1 | s_1 ||","tenor":":m |r :s |s :s |f :f |m :r |m :l |s :fe |s :— |—|| :s |f :f |s :s |f :m |f :l |l :l |s :f |m :— |—|| f | m ||","bass":":d |t_1 :s_1 |d :m_1 |f_1 :l_1 |d :t_1 |l_1 :d |r :r |s_1 :— |—|| :d.ta_1 |l_1 :f |m :d |f :d |r :l_1 |f_1 :r_1 |s_1 :s_1 |d :— |—|| f_1 | d ||"}', 'X:1
T:Edinburgh
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:E
[V:1] e2b2b2g2 | e2c''2c''2b2 | b2e''2e''2d''2 | c''2b6 | g2a2c''2b2 | e''2c''3ba2 | g2f2a2g2 | f2e6 | e2e2
[V:2] e2f2d2e2 | e2e2e2e2 | f2e2g2d2 | fed6 | e2e2e2e2 | g2e3=dc2 | e2e2e2e2 | d2e6 | c2B2
[V:3] g2f2b2b2 | b2a2a2g2 | f2g2c''2b2 | ^a2b6 | b2a2a2b2 | b2a2g2a2 | c''2c''2c''2b2 | a2g6 | a2g2
[V:4] e2d2B2e2 | G2A2c2e2 | d2c2e2f2 | f2B6 | e=dc2a2g2 | e2a2e2f2 | c2A2F2B2 | B2e6 | A2e2', NULL, NULL, NULL, NULL, 'missing!', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Edinburgh
M:C
L:1/8
Q:1/4=76
K:E
e2b2b2g2 | e2c''2c''2b2
% PHRASE_BREAK
 | b2e''2e''2d''2 | c''2b6
% PHRASE_BREAK
 |
g2a2c''2b2 | e''2c''3ba2
% PHRASE_BREAK
 | g2f2a2g2 | f2e6 | e2e2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (125, 'reciFpJGu2QuW3Lpw', 'Glasgow', 'CM', 'X:1
T:Glasgow
M:C
L:1/8
Q:1/4=76
K:G
d2g4a2 | bag2b2d''
% PHRASE_BREAK
e'' | d''2c''2b4 | b2a4
% PHRASE_BREAK
c''2 | bag2f2g4 |
d''2d''4
% PHRASE_BREAK
b2 | c''4e''2d''2 | c''2b2a4 | d''2g2a2b2 | c''2b2a2g4 | g2g2
', NULL, '{"doh":"G","time":"C","soprano":":s_1 |d :— :r |m.,r:d :m |s.,l:s :f |m :— :m |r :— :f |m.,r:d :t_1 |d :—||:s |s :— :m |f :— :l |s :f :m |r :— :s |d :r :m |f :m :r |d :—||d |d||","alto":":m_1 |s_1 :— :t_1 |d :— :d |d :— :t_1 |d :— :d |l_1 :— :r |d.,l_1:s_1 :s_1 |s_1 :—||:d |m.,r:d :d |d.,ta_1:l_1 :f_1 |s_1.,l_1:t_1 :d |t_1 :— :t_1 |d :s_1 :s_1 |d :— :t_1 |d :—||l_1 |s_1||","tenor":":d |s :— :s |s.,f:m :s |m.,f:m :r |d :— :s |f :— :l |s.,f:m :r |m :—||:m |s.,f:m :s |f :— :d |d :r :m.f |s :— :s.f |m :s :s |l :s :s.f |m :—||f |m||","bass":":d_1 |m_1 :— :s_1 |d :— :d |s_1 :— :s_1 |d_1 :— :d |f_1 :— :r_1 |m_1.,f_1:s_1 :s_1 |d_1 :—||:d |d :— :ta_1 |l_1.,s_1:f_1 :f_1 |m_1 :r_1 :d_1 |s_1 :— :s_1 |l_1 :t_1 :d |f_1 :s_1 :s_1 |d_1 :—||f_1 |d_1||"}', 'X:1
T:Glasgow
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d2g4a2 | bag2b2d''e'' | d''2c''2b4 | b2a4c''2 | bag2f2g4 | d''2d''4b2 | c''4e''2d''2 | c''2b2a4 | d''2g2a2b2 | c''2b2a2g4 | g2g2
[V:2] B2d4f2 | g4g2g4 | f2g4g2 | e4a2ge | d2d2d4 | g2bag2g2 | g=fe2c2de | f2g2f4 | f2g2d2d2 | g4f2g4 | e2d2
[V:3] g2d''4d''2 | d''c''b2d''2bc'' | b2a2g4 | d''2c''4e''2 | d''c''b2a2b4 | b2d''c''b2d''2 | c''4g2g2 | a2bc''d''4 | d''c''b2d''2d''2 | e''2d''2d''c''b4 | c''2b2
[V:4] G2B4d2 | g4g2d4 | d2G4g2 | c4A2Bc | d2d2G4 | g2g4=f2 | edc2c2B2 | A2G2d4 | d2e2f2g2 | c2d2d2G4 | c2G2', NULL, NULL, NULL, 'https://hymnary.org/media/fetch/180190', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Glasgow
M:C
L:1/8
Q:1/4=76
K:G
d2g4a2 | bag2b2d''
% PHRASE_BREAK
e'' | d''2c''2b4 | b2a4
% PHRASE_BREAK
c''2 | bag2f2g4 |
d''2d''4
% PHRASE_BREAK
b2 | c''4e''2d''2 | c''2b2a4 | d''2g2a2b2 | c''2b2a2g4 | g2g2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (56, 'recKvAB5eycRKuPlK', 'Communion', 'LM (long meter, 88 88)', 'X:1
T:Communion
M:C
L:1/8
K:Eb
=B2e2=e2_d2 | =B4e2_g4 | a2 _g4
w: Lord, in _ thy wrath re- buke me not;
% PHRASE_BREAK
_g2 | =b4_b2a4 | _g2_g2=e2 _e2 e2 _d2
w: Nor in thy hot rage chas- _ ten me. _
% PHRASE_BREAK
| _d2_g4 | a2b4_g2 =b2 e2 f2 _g4
w: Lord, pi- ty me, for I _ am weak:
% PHRASE_BREAK
| =B2=e4_e2 | _d4=B2=B_d | e2_d2=B4
w: Heal me, for my bones ve- _ _ xed be.', NULL, '{"doh":"Eb","time":"C","soprano":":d | m :f :r | d :— :m | s :— :l | s :— || :s | d'' :— :t | l :— :s | s :f :m | m :r || :r | s :— :l | t :— :s | d'' :m :fe | s :— || :d | f :— :m | r :— :d | d.r :m :r | d :— || d | d ||","alto":":s_1 | d :— :t_1 | d :— :d | d :— :d | d :— || :d | d :— :d | d :— :d | r :— :d | d :t_1 || :t_1 | r :— :r | r :— :t_1 | d :— :d | t_1 :— || :s_1 | l_1 :t_1 :d | t_1 :— :d | d :— :t_1 | d :— || l_1 | s_1 ||","tenor":":m | s :l :s | m :— :s | s :— :f | m :— || :m | s :— :m | f :— :s | s :— :s | s :— || :s | s :— :fe | s :— :s | s :l :l | s :— || :s | f :— :s | s :f :m | l :s :f | m :— || f | m ||","bass":":d | d :f_1 :s_1 | d :— :d | m :— :f | d :— || :d | m :— :d | f :— :m | t_1 :— :d | s_1 :— || :s_1 | t_1 :— :r | s :— :f | m :d :r | s_1 :— || :m | r :— :d | s_1 :— :l_1 | f_1 :s_1 :s_1 | d :— || f_1 | d ||"}', 'X:1
T:Communion
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2e2=e2_d2 | =B4e2_g4 | a2_g4_g2 | =b4_b2a4 | _g2_g2=e2_e2 | e2_d2_d2_g4 | a2b4_g2 | =b2e2f2_g4 | =B2=e4_e2 | _d4=B2=B_d | e2_d2=B4 | =B2=B2
[V:2] _G2=B4_B2 | =B4=B2=B4 | =B2=B4=B2 | =B4=B2=B4 | =B2_d4=B2 | =B2_B2=B2_d4 | _d2_d4B2 | =B4=B2_B4 | _G2A2B2=B2 | B4=B2=B4 | B2=B4A2 | _G2
[V:3] e2_g2a2_g2 | e4_g2_g4 | =e2_e4=e2 | _g4e2=e4 | _g2_g4_g2 | _g4_g2_g4 | f2_g4_g2 | _g2a2a2_g4 | _g2=e4_g2 | _g2=e2_e2a2 | _g2=e2_e4 | =e2_e2
[V:4] =B2=B2=E2_G2 | =B4=B2e4 | =e2=B4=B2 | e4=B2=e4 | e2B4=B2 | _G4_G2B4 | _d2_g4=e2 | e2=B2_d2_G4 | e2_d4=B2 | _G4A2=E2 | _G2_G2=B4 | =E2=B2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Communion
M:C
L:1/8
Q:1/4=76
K:Eb
=B2e2=e2_d2 | =B4e2_g4 | a2
% PHRASE_BREAK
_g4_g2 | =b4_b2a4 | _g2_g2=e2
% PHRASE_BREAK
_e2 |
e2_d2_d2_g4 | a2b4_g2
% PHRASE_BREAK
 | =b2e2f2_g4 | =B2=e4_e2 | _d4=B2=B_d | e2_d2=B4 | =B2=B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (138, 'recneWZYymEjTv2Oj', 'Dundee', 'CM', 'X:1
T:Dundee
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | A G F
% PHRASE_BREAK
#2 | G A B G | A3 :|
| D
% PHRASE_BREAK
 | G G A B | c B A G
% PHRASE_BREAK
 | F# G A F# | G3 :|
| G | A A B c | B A G2 | A B c A | B3 :|
| G | A B c d | B c A G | F# G A F# | G3 :|
', NULL, '{"doh":"C","time":"C","soprano":":l |l :t |d'' :t |l :l |se :d'' |m'' :r'' |d'' :t |d'' :— |— || :d'' |m'' :r'' |d'' :t |l :l |se :d'' |t :l |l :se |l :— |— || l |l ||","alto":":m |m :m |m :m |f :f |m :m |s :f |m :r |m :— |— || :m |s :s |m :m |d :f |m :m |m :d |f :m |m :— |— || f |m ||","tenor":":d'' |l :se |l :t |d'' :r'' |t :d'' |d'' :l |s :s |s :— |— || :d'' |d'' :t |l :se |l :r'' |t :l |se :l |r'' :t |d'' :— |— || r'' |de'' ||","bass":":l_1 |d :m |l :s |f :r |m :l |m :f |s :s_1 |d :— |— || :d |d'' :s |l :m |f :r |m :l_1 |m :f |r :m |l_1 :— |— || r |l_1 ||","lah":"A","mode":"minor"}', 'X:1
T:Dundee
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Am
[V:1] a2a2b2c''2 | b2a2a2^g2 | c''2e''2d''2c''2 | b2c''6 | c''2e''2d''2c''2 | b2a2a2^g2 | c''2b2a2a2 | ^g2a6 | a2a2
[V:2] e2e2e2e2 | e2f2f2e2 | e2g2f2e2 | d2e6 | e2g2g2e2 | e2c2f2e2 | e2e2c2f2 | e2e6 | f2e2
[V:3] c''2a2^g2a2 | b2c''2d''2b2 | c''2c''2a2g2 | g2g6 | c''2c''2b2a2 | ^g2a2d''2b2 | a2^g2a2d''2 | b2c''6 | d''2^c''2
[V:4] A2c2e2a2 | g2f2d2e2 | a2e2f2g2 | G2c6 | c2c''2g2a2 | e2f2d2e2 | A2e2f2d2 | e2A6 | d2A2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Dundee
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | A G F
% PHRASE_BREAK
#2 | G A B G | A3 :|
| D
% PHRASE_BREAK
 | G G A B | c B A G
% PHRASE_BREAK
 | F# G A F# | G3 :|
| G | A A B c | B A G2 | A B c A | B3 :|
| G | A B c d | B c A G | F# G A F# | G3 :|
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (172, 'reczq6IIAoHT3hX8d', 'Forest Green', 'CM', 'X:1
T:Forest Green
M:C
L:1/8
Q:1/4=76
K:G
d''2g''2a''2b''2 | e''2d''2c''2b2
% PHRASE_BREAK
 | a2g6 | g''2f''2e''2d''2
% PHRASE_BREAK
 |
c''2b2a6 | b2c''2d''2e''2 | f''''2
% PHRASE_BREAK
d''''2e''2f''2 | d''6e''2 | d''2c''2b2a2 | g2f6
', NULL, '{"doh":"G","time":"C","soprano":":s |d'' :r'' |m'' :l |s :f |m :r |d :— |— |d'' :t |l :s |f :m |r :— |— |m :f |s :l |t'' :s'' |l :t |s :— |— |l :s |f :m |r :d |t_1 :— |—||","alto":":m |s :s |s :l |s :t |l :s |m :— |— |s :s |f :m |r :d |t_1 :— |— |d :r |m :f |s :s |f :m |r :— |— |f :m |r :d |t_1 :l_1 |s_1 :— |—||","tenor":":d |d :t_1 |l_1 :f_1 |m_1 :r |d :— |— |l :l |l :l |l :s |f :— |— |s :l |s :l |s :d'' |l :s |l :— |— |s :s |l :s |f :m |r :— |—||","bass":":d_1 |d_1 :t_1 |l_1 :f_1 |m_1 :r |d :— |— |m_1 :m_1 |r_1 :d_1 |l_1 :— |—||d_1 :r_1 |m_1 :f_1 |s_1 :s_1 |l_1 :s_1 |m_1 :— |— |l_1 :l_1 |s_1 :l_1 |f_1 :m_1 |r_1 :— |—||"}', 'X:1
T:Forest Green
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:G
[V:1] d''2g''2a''2b''2 | e''2d''2c''2b2 | a2g6 | g''2f''2e''2d''2 | c''2b2a6 | b2c''2d''2e''2 | f''''2d''''2e''2f''2 | d''6e''2 | d''2c''2b2a2 | g2f6
[V:2] b2d''2d''2d''2 | e''2d''2f''2e''2 | d''2b6 | d''2d''2c''2b2 | a2g2f6 | g2a2b2c''2 | d''2d''2c''2b2 | a6c''2 | b2a2g2f2 | e2d6
[V:3] g2g2f2e2 | c2B2a2g6 | e''2e''2e''2e''2 | e''2d''2c''6 | d''2e''2d''2e''2 | d''2g''2e''2d''2 | e''6d''2 | d''2e''2d''2c''2 | b2a6
[V:4] G2G2f2e2 | c2B2a2g6 | B2B2A2G2 | e6G2 | A2B2c2d2 | d2e2d2B6 | e2e2d2e2 | c2B2A6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Forest Green
M:C
L:1/8
Q:1/4=76
K:G
d''2g''2a''2b''2 | e''2d''2c''2b2
% PHRASE_BREAK
 | a2g6 | g''2f''2e''2d''2
% PHRASE_BREAK
 |
c''2b2a6 | b2c''2d''2e''2 | f''''2
% PHRASE_BREAK
d''''2e''2f''2 | d''6e''2 | d''2c''2b2a2 | g2f6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (36, 'recDj0ObRM5jIl5lW', 'Elgin', 'CM', 'X:1
T:Elgin
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G A B c | d c B2
% PHRASE_BREAK
 | A G F# E | D3 :|
| D
% PHRASE_BREAK
 | G A B G | A B c2 | B
% PHRASE_BREAK
 c d B | c3 :|
| c | d c B A | G A B2 | c B A G | A3 :|
| G | A B c d | e d c2 | B c A G | G3 :|
', NULL, '{"doh":"Bb","time":"C","soprano":":d |t_1 :l_1 |t_1 :m |r :d |t_1 :l_1 |r :d |t_1 :l_1 |t_1 :— |— || :m |d :m |r :t_1 |d :r |t_1 :l_1 |r :d |t_1 :t_1 |l_1 :— |— || l_1 | l_1 ||","alto":":m_1 |m_1 :m_1 |m_1 :m_1 |se_1 :l_1 |se_1 :l_1 |r_1 :m_1 |f_1 :m_1 |m_1 :— |— || :m_1 |s_1 :s_1 |r_1 :m_1 |m_1 :f_1 |m_1 :m_1 |r_1 :m_1 |m_1 :-.r_1 |d_1 :— |— || r_1 | de_1 ||","tenor":":l_1 |t_1 :d |se_1 :l_1 |t_1 :d.r |m :d |l_1 :l_1 |t_1 :d.l_1 |se_1 :— |— || :s_1 |s_1 :d |t_1 :r |d :t_1.l_1 |se_1 :l_1 |se_1 :l_1 |l_1 :se_1 |l_1 :— |— || f_1 | m_1 ||","bass":":l_1 |se_1 :l_1 |m_1 :d_1 |t_2 :l_2 |m_1 :l_1 |f_1 :m_1 |r_1 :l_2 |m_1 :— |— || :d_1 |m_1 :d_1 |s_1 :se_1 |l_1 :r_1 |m_1 :d_1 |t_2 :l_2 |m_1 :m_1 |l_2 :— |— || r_1 | l_2 ||","lah":"G","mode":"minor"}', 'X:1
T:Elgin
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Gm
[V:1] B2A2G2A2 | d2c2B2A2 | G2c2B2A2 | G2A6 | d2B2d2c2 | A2B2c2A2 | G2c2B2A2 | A2G6 | G2G2
[V:2] D2D2D2D2 | D2_G2=G2_G2 | G2C2D2E2 | D2D6 | D2F2F2C2 | D2D2E2D2 | D2C2D2D3 | CB,6C2 | =B,2
[V:3] G2A2B2_G2 | G2A2Bcd2 | B2G2G2A2 | BG_G6 | F2F2B2A2 | c2B2AG_G2 | G2_G2=G2G2 | _G2=G6 | E2D2
[V:4] G2_G2=G2D2 | B,2A,2G,2D2 | G2E2D2C2 | G,2D6 | B,2D2B,2F2 | _G2=G2C2D2 | B,2A,2G,2D2 | D2G,6 | C2G,2', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Elgin
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G A B c | d c B2
% PHRASE_BREAK
 | A G F# E | D3 :|
| D
% PHRASE_BREAK
 | G A B G | A B c2 | B
% PHRASE_BREAK
 c d B | c3 :|
| c | d c B A | G A B2 | c B A G | A3 :|
| G | A B c d | e d c2 | B c A G | G3 :|
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (78, 'recTiS91QYUYm26Xk', 'Martyrs', 'CM', 'X:1
T:Martyrs
M:C
L:1/8
Q:1/4=76
K:Bm
e2g2e2b2 | g2f2e2b2
% PHRASE_BREAK
 | b2d''2b2c''2 |
e''2b6
% PHRASE_BREAK
 | b2d''2a2b2 | g2f2e2b2
% PHRASE_BREAK
 | d''2c''2a2c''2 | b2e6
', NULL, '{"doh":"D","time":"C","soprano":":r |f :r |l :f |m :r |l :l |d'' :l |t :r'' |l :- |-|| :l |d'' :s |l :f |m :r |l :d'' |t :s |t :l |r :- |-||","alto":":l_1 |r :r |de:l_1.t_1 |d :r |de:r |m :f |s :f |m :- |-|| :f |s :m |d :r |de:r |d :m |r :m |r :r.de |r :- |-||","tenor":":f |l :f |m :f |s.l:ta.s |m :f |s :l |s :l.t |de'':- |-|| :d'' |d'' :d'' |l :l |l :f |f :s |s :s |s :m |f :- |-||","bass":":r |r :r |l_1 :r |d :ta_1 |l_1 :r |d :f |m :r |l :- |-|| :f |m :d |f :r |l_1 :ta_1 |f_1 :d |s_1 :d |s_1 :l_1 |r :- |-||","lah":"B","mode":"minor"}', 'X:1
T:Martyrs
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bm
[V:1] e2g2e2b2 | g2f2e2b2 | b2d''2b2c''2 | e''2b6 | b2d''2a2b2 | g2f2e2b2 | d''2c''2a2c''2 | b2e6
[V:2] B2e2e2^d2 | Bcd2e2^d2 | e2f2g2a2 | g2f6 | g2a2f2d2 | e2^d2e2=d2 | f2e2f2e2 | e^de6
[V:3] g2b2g2f2 | g2ab=c''af2 | g2a2b2a2 | bc''^d''6 | d''2d''2d''2b2 | b2b2g2g2 | a2a2a2a2 | f2g6
[V:4] e2e2e2B2 | e2d2=c2B2 | e2d2g2f2 | e2b6 | g2f2d2g2 | e2B2=c2G2 | d2A2d2A2 | B2e6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=11mZ-uwcBpY&ab_channel=JasonCoghill-Topic', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Martyrs
M:C
L:1/8
Q:1/4=76
K:Bm
e2g2e2b2 | g2f2e2b2
% PHRASE_BREAK
 | b2d''2b2c''2 |
e''2b6
% PHRASE_BREAK
 | b2d''2a2b2 | g2f2e2b2
% PHRASE_BREAK
 | d''2c''2a2c''2 | b2e6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (30, 'rec9MYBkHpm65htcF', 'Crimond', 'CM', 'X:1
T:Crimond
M:C
L:1/8
Q:1/4=76
K:F
c2a4bg | c''4bgf4 e2 f4
w: The Lord''s my _ she- pherd, _ I''ll not want.
% PHRASE_BREAK
| a2 | a2g2g2 =b4 =b2 c''4
w: He makes _ me down to lie
% PHRASE_BREAK
|
a2 | a2b2a2g4 a2 b2 c''2 b2 a4
w: In pas- _ tures green: he lead- _ eth me
% PHRASE_BREAK
| a2g2 | b2d''2f4 | e2f4
w: the qu- _ i- et waters by.', NULL, '{"doh":"F","time":"C","soprano":":s_1 | m:-:f.,r | s:-:f.r | d:-:t_1 | d:-:m | m:r:r | fe:-:fe | s:-|| :m | m:f:m | r:-:m | f:s:f | m:-:m | r:f:l | d:-:t_1 | d:-||","alto":":s_1 | d:-:r.,t_1 | m:d:l_1 | s_1:-:s_1 | s_1:-:d | d:-:d | l_1:r:d | t_1:-|| :d | d:r:d | t_1:-:d | r:m:r | d:-:d | l_1:-:l_1 | s_1:-:s_1 | s_1:-||","tenor":":m | s:-:f | m:-:f | m:-:r | m:-:s | fe:-:fe | l:-:l | s:-|| :s | s:r:m.f | s:-:s | s:-:s | s:-:s | f:-:f | m:-:r | m:-||","bass":":d | d:-:d | d:-:f_1 | s_1:-:s_1 | d:-:d.t_1 | l_1:-:l_1 | r:-:r_1 | s_1:-|| :d | s_1:-:s_1 | s_1:f:m | r:s_1:l_1.t_1 | d:-:d | f_1:-:f_1 | s_1:-:s_1 | d:-||"}', 'X:1
T:Crimond
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:F
[V:1] c2a4bg | c''4bgf4 | e2f4a2 | a2g2g2=b4 | =b2c''4a2 | a2b2a2g4 | a2b2c''2b2 | a4a2g2 | b2d''2f4 | e2f4
[V:2] c2f4ge | a2f2d2c4 | c2c4f2 | f4f2d2 | g2f2e4 | f2f2g2f2 | e4f2g2 | a2g2f4 | f2d4d2 | c4c2c4
[V:3] a2c''4b2 | a4b2a4 | g2a4c''2 | =b4=b2d''4 | d''2c''4c''2 | c''2g2abc''4 | c''2c''4c''2 | c''4c''2b4 | b2a4g2 | a4
[V:4] f2f4f2 | f4B2c4 | c2f4fe | d4d2g4 | G2c4f2 | c4c2c2 | b2a2g2c2 | def4f2 | B4B2c4 | c2f4', NULL, NULL, NULL, 'https://hymnary.org/media/fetch/179495', NULL, 'Ps 23', false, false, NULL, NULL, NULL, false, 'X:1
T:Crimond
M:C
L:1/8
Q:1/4=76
K:F
c2a4bg | c''4bgf4
% PHRASE_BREAK
 | e2f4a2 | a2g2g2
% PHRASE_BREAK
=b4 |
=b2c''4a2 | a2b2a2g4
% PHRASE_BREAK
 | a2b2c''2b2 | a4a2g2 | b2d''2f4 | e2f4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (90, 'recXA6u30YyZNiHGB', 'Evan', 'CM', 'X:1
T:Evan
M:C
L:1/8
Q:1/4=76
K:Bb
F2F2B2d2 | c2B2G2F2
% PHRASE_BREAK
 | F2F2B2d2 |
B2c6
% PHRASE_BREAK
 | e2d2c2B2 | c2d2B2G2
% PHRASE_BREAK
 | F2F2B2d2 | c2B6
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 | s_1 :d | m :r | d :l_1 | s_1 :s_1 | s_1 :d | m :d | r :— | — || :f | m :r | d :r | m :d | l_1 :s_1 | s_1 :d | m :r | d :— | — ||","alto":":m_1 | r_1 :s_1 | s_1 :f_1 | s_1 :f_1 | m_1 :s_1 | s_1 :m_1 | m_1 :m_1 | s_1 :— | — || :l_1 | s_1 :s_1 | m_1 :l_1 | se_1 :l_1 | l_1 :m_1 | s_1 :fe_1 | s_1 :—.f_1 | m_1 :— | — ||","tenor":":d | t_1 :d | d :l_1 | d :d | d :m | r :d | t_1 :d | t_1 :— | — || :d | d :t_1 | d :l_1 | t_1 :d | d :d | r :d | d :t_1 | d :— | — ||","bass":":d | s_1 :m_1 | d_1 :r_1 | m_1 :f_1 | d_1 :d | t_1 :l_1 | se_1 :l_1 | s_1 :— | — || :f_1 | d :s_1 | l_1 :f_1 | m_1 :l_1 | f_1 :d | t_1 :l_1 | s_1 :s_1 | d_1 :— | — ||"}', 'X:1
T:Evan
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2F2B2d2 | c2B2G2F2 | F2F2B2d2 | B2c6 | e2d2c2B2 | c2d2B2G2 | F2F2B2d2 | c2B6
[V:2] D2C2F2F2 | E2F2E2D2 | F2F2D2D2 | D2F6 | G2F2F2D2 | G2_G2=G2G2 | D2F2=E2F3 | ED6
[V:3] B2A2B2B2 | G2B2B2B2 | d2c2B2A2 | B2A6 | B2B2A2B2 | G2A2B2B2 | B2c2B2B2 | A2B6
[V:4] B2F2D2B,2 | C2D2E2B,2 | B2A2G2_G2 | G2F6 | E2B2F2G2 | E2D2G2E2 | B2A2G2F2 | F2B,6', NULL, NULL, NULL, 'https://youtu.be/v_emzzA5SU8?si=8dxlmtLVW7U4-LtV', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Evan
M:C
L:1/8
Q:1/4=76
K:Bb
F2F2B2d2 | c2B2G2F2
% PHRASE_BREAK
 | F2F2B2d2 |
B2c6
% PHRASE_BREAK
 | e2d2c2B2 | c2d2B2G2
% PHRASE_BREAK
 | F2F2B2d2 | c2B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (123, 'reci8nHObF0ZOOQRN', 'Belmont', 'CM', 'X:1
T:Belmont
M:C
L:1/8
Q:1/4=76
K:A
e2c''4b2 | a4g2g2 | f2a2
% PHRASE_BREAK
e4 | e''2e''2d''2c''2 | c''2
% PHRASE_BREAK
b2a2a2 |
g2e2c''4 | b2a4
% PHRASE_BREAK
g2 | g2f2a2e4 | e''2e''2d''2b2 | a2c''2b2a4 | a2a2
', NULL, '{"doh":"A","time":"C","soprano":":s_1 | m :—:r | d :—:t_1 | t_1 :l_1 :d | s_1 :—:s | s :f :m | m :r :d | d :t_1 || :s_1 | m :—:r | d :—:t_1 | t_1 :l_1 :d | s_1 :—:s | s :f :r | d :m :r | d :— || d | d ||","alto":":m_1 | s_1 :—:f_1 | m_1 :—:s_1 | s_1 :f_1 :f_1 | m_1 :—:s_1 | s_1 :—:s_1 | l_1 :—:l_1 | s_1 :— || :m_1 | s_1 :—:f_1 | m_1 :—:s_1 | s_1 :f_1 :f_1 | m_1 :—:s_1 | l_1 :—:l_1 | s_1 :—:f_1 | m_1 :— || f_1 | m_1 ||","tenor":":d | d :—:t_1 | d :—:m | d :—:d | d :—:m | r :—:s | s :f :m | m :r || :d | d :—:t_1 | d :—:m | d :—:d | d :—:d | d :—:f | m :d :t_1 | d :— || l_1 | s_1 ||","bass":":d_1 | d_1 :—:s_1 | l_1 :—:m_1 | f_1 :—:l_1 | d :—:d | t_1 :—:d | f_1 :—:fe_1 | s_1 :— || :d_1 | d_1 :—:s_1 | l_1 :—:m_1 | f_1 :—:l_1 | d :—:m_1 | f_1 :—:f_1 | s_1 :—:s_1 | d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Belmont
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2c''4b2 | a4g2g2 | f2a2e4 | e''2e''2d''2c''2 | c''2b2a2a2 | g2e2c''4 | b2a4g2 | g2f2a2e4 | e''2e''2d''2b2 | a2c''2b2a4 | a2a2
[V:2] c2e4d2 | c4e2e2 | d2d2c4 | e2e4e2 | f4f2e4 | c2e4d2 | c4e2e2 | d2d2c4 | e2f4f2 | e4d2c4 | d2c2
[V:3] a2a4g2 | a4c''2a4 | a2a4c''2 | b4e''2e''2 | d''2c''2c''2b2 | a2a4g2 | a4c''2a4 | a2a4a2 | a4d''2c''2 | a2g2a4 | f2e2
[V:4] A2A4e2 | f4c2d4 | f2a4a2 | g4a2d4 | ^d2e4A2 | A4e2f4 | c2d4f2 | a4c2d4 | d2e4e2 | A4d2A2', NULL, NULL, NULL, 'https://youtu.be/kuh5_k8hNDA?si=4IHuy_8PnbQsq4A7', NULL, 'start high', false, false, NULL, NULL, NULL, false, 'X:1
T:Belmont
M:C
L:1/8
Q:1/4=76
K:A
e2c''4b2 | a4g2g2 | f2a2
% PHRASE_BREAK
e4 | e''2e''2d''2c''2 | c''2
% PHRASE_BREAK
b2a2a2 |
g2e2c''4 | b2a4
% PHRASE_BREAK
g2 | g2f2a2e4 | e''2e''2d''2b2 | a2c''2b2a4 | a2a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (145, 'recqfqvAjQUhIJ770', 'Lynton', 'CM', 'X:1
T:Lynton
M:C
L:1/8
Q:1/4=76
K:C
e2e2e2d4 | e2g4f2 | e6
% PHRASE_BREAK
g2 | g2^g2a4 |
e2f6
% PHRASE_BREAK
 | b2b2a2g4 | g2g2e''2d''2
% PHRASE_BREAK
 | c''6a2 | g2e2d4 | f2e6
', NULL, '{"doh":"C","time":"C","soprano":"m:m:m | r:-:m | s:-:f | m:-:- | s:s:se | l:-:m | f:-:- || t:t:l | s:-:s | s:m'':r'' | d'':-:- | l:s:m | r:-:f | m:-:-||","alto":"d:d:d | t_1:-:d | d:-:r | d:-:- | m:m:m | m:-:de | r:-:- || f:f:f | f:-:f | m:s:s | s:-:- | f.m:r:d | d:-:t_1 | d:-:-||","tenor":"s:s:s | s:-:s | l:-:s | s:-:- | d'':d'':r'' | de'':-:l | l:-:- || t:r'':d'' | t:d'':r'' | d'':-:t | d'':-:- | d'':t:d'' | l:-:s | s:-:-||","bass":"d:d:d | f:-:m | r:-:s_1 | d:-:- | d:d:t_1 | l_1:-:l_1 | r:-:- || s_1:s_1:s_1 | s_1:l_1:t_1 | d:-:r | m:-:- | f:s:l | f:-:s | d:-:-||"}', 'X:1
T:Lynton
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:C
[V:1] e2e2e2d4 | e2g4f2 | e6g2 | g2^g2a4 | e2f6 | b2b2a2g4 | g2g2e''2d''2 | c''6a2 | g2e2d4 | f2e6
[V:2] c2c2c2B4 | c2c4d2 | c6e2 | e2e2e4 | ^c2d6 | f2f2f2f4 | f2e2g2g2 | g6fe | d2c2c4 | B2c6
[V:3] g2g2g2g4 | g2a4g2 | g6c''2 | c''2d''2^c''4 | a2a6 | b2d''2c''2b2 | c''2d''2c''4 | b2c''6 | c''2b2c''2a4 | g2g6
[V:4] c2c2c2f4 | e2d4G2 | c6c2 | c2B2A4 | A2d6 | G2G2G2G2 | A2B2c4 | d2e6 | f2g2a2f4 | g2c6', NULL, NULL, NULL, NULL, 'missing', NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Lynton
M:C
L:1/8
Q:1/4=76
K:C
e2e2e2d4 | e2g4f2 | e6
% PHRASE_BREAK
g2 | g2^g2a4 |
e2f6
% PHRASE_BREAK
 | b2b2a2g4 | g2g2e''2d''2
% PHRASE_BREAK
 | c''6a2 | g2e2d4 | f2e6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (7, 'rec25fi3ub9065dyj', 'Sawley (start high)', 'CM', 'X:1
T:Sawley (start high)
M:C
L:1/8
Q:1/4=76
K:Bb
B2A2G2F4 | d2E2A2G2
% PHRASE_BREAK
 | F6d2 | c2B2A2B2
% PHRASE_BREAK
 |
G2F6 | B2A2G2F4 | d2E2
% PHRASE_BREAK
A2G2 | F6G2 | A2B2d4 | c2B6
', NULL, '{"doh":"Bb","time":"C","soprano":"d :t_1 :l_1 | s_1 :— :m | f_1 :t_1 :l_1 | s_1 :— :— | m :r :d | t_1 :d :l_1 | s_1 :— :— || d :t_1 :l_1 | s_1 :— :m | f_1 :t_1 :l_1 | s_1 :— :— | l_1 :t_1 :d | m :— :r | d :— :— ||","alto":"m_1 :s_1 :f_1 | m_1 :— :m_1 | r_1 :f_1 :f_1 | m_1 :— :— | s_1 :s_1 :s_1 | s_1 :— :fe_1 | s_1 :— :— || s_1 :s_1 :f_1 | f_1 :m_1 :d_1 | f_1 :— :r_1 | m_1 :— :— | l_1 :la_1 :s_1 | s_1 :— :f_1 | m_1 :— :— ||","tenor":"d :d :d | d :— :d | t_1 :r :t_1 | d :— :— | d :t_1 :d | r :m :d | t_1 :— :— || d :d :d | d :— :d | d :r :t_1 | d :— :— | d :r :m | d :l_1 :t_1 | d :— :— ||","bass":"d_1 :d_1 :d_1 | d_1 :— :d_1 | s_1 :— :s_1 | d_1 :— :— | d_1 :r_1 :m_1 | r_1 :— :r_1 | s_1 :— :f_1 || m_1 :m_1 :f_1 | d_1 :— :ta_1 | l_1 :s_1 :f_1 | m_1 :— :— | f_1 :f_1 :m_1 | s_1 :— :s_1 | d_1 :— :— ||"}', 'X:1
T:Sawley (start high)
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] B2A2G2F4 | d2E2A2G2 | F6d2 | c2B2A2B2 | G2F6 | B2A2G2F4 | d2E2A2G2 | F6G2 | A2B2d4 | c2B6
[V:2] D2F2E2D4 | D2C2E2E2 | D6F2 | F2F2F4 | =E2F6 | F2F2E2E2 | D2B,2E4 | C2D6 | G2_G2F2F4 | E2D6
[V:3] B2B2B2B4 | B2A2c2A2 | B6B2 | A2B2c2d2 | B2A6 | B2B2B2B4 | B2B2c2A2 | B6B2 | c2d2B2G2 | A2B6
[V:4] B,2B,2B,2B,4 | B,2F4F2 | B,6B,2 | C2D2C4 | C2F4E2 | D2D2E2B,4 | _A2G2F2E2 | D6E2 | E2D2F4 | F2B,6', NULL, NULL, NULL, 'https://youtu.be/tFTsjpn17To?si=DJlSEFFgltSCR05B', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Sawley (start high)
M:C
L:1/8
Q:1/4=76
K:Bb
B2A2G2F4 | d2E2A2G2
% PHRASE_BREAK
 | F6d2 | c2B2A2B2
% PHRASE_BREAK
 |
G2F6 | B2A2G2F4 | d2E2
% PHRASE_BREAK
A2G2 | F6G2 | A2B2d4 | c2B6
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (163, 'recwCwo7Ebl6QmzDd', 'Pembroke', 'CM', 'X:1
T:Pembroke
M:C
L:1/8
K:Bb
F2B4c2 | d2c2B2c2 | B2A2B4 | F2G2A2B2 | F2e2d2d2 | c2c2B2A2 | GFB4c2 | d2c2B2B2 | A2F2BAB2 | c2dcd2e2 | f4e2d2 | c2B2cded2 | c2B4', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 |d :— :r |m :r :d |r :d :t_1 |d :— :s_1 |l_1 :t_1 :d |s_1 :f :m |m :r :r |d :t_1 :l_1.s_1 |d :— :r |m :r :d |d :t_1 :s_1 |d.,t_1:d :r |m.,r:m :f |s :— :f |m :r :d |r.m,f:m :r |d :—||","alto":":m_1 |s_1 :— :s_1 |s_1 :— :s_1 |l_1 :s_1 :s_1 |m_1 :— :m_1 |f_1 :s_1 :s_1 |s_1 :— :s_1 |s_1 :— :s_1 |s_1 :— :r_1 |m_1 :s_1 :s_1 |s_1 :— :s_1 |s_1 :— : |: : |: : |: :s_1 |s_1 :— :s_1 |l_1 :s_1 :s_1 |m_1 :—||","tenor":":d |m :— :t_1 |d :r :m |f :m :r |d :— :d |d :r :m |r :— :d |t_1 :— :r |m :r :d.t_1 |d :— :t_1 |d :f :m |m :r : |: :s_1 |d.,t:d :r |m :— :t_1 |d :r :m |d :— :t_1 |d :—||","bass":":d_1 |d_1 :— :s_1 |d :t_1 :d |f_1 :s_1 :s_1 |d_1 :— :d_1 |f_1.m_1 :r_1 :d_1 |t_2 :— :d_1 |s_1 :— :s_1 |s_1 :— :f_1 |m_1 :— :r_1 |d_1 :t_2 :d_1 |s_1 :— : |: : |: : |: :s_1 |d :t_1 :d |f_1 :s_1 :s_1 |d_1 :—||"}', 'X:1
T:Pembroke
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2B4c2 | d2c2B2c2 | B2A2B4 | F2G2A2B2 | F2e2d2d2 | c2c2B2A2 | GFB4c2 | d2c2B2B2 | A2F2BAB2 | c2dcd2e2 | f4e2d2 | c2B2czd2 | c2B4
[V:2] D2F4F2 | F4F2G2 | F2F2D4 | D2E2F2F2 | F4F2F4 | F2F4C2 | D2F2F2F4 | F2F4F2 | F4F2G2 | F2F2D4
[V:3] B2d4A2 | B2c2d2e2 | d2c2B4 | B2B2c2d2 | c4B2A4 | c2d2c2BA | B4A2B2 | e2d2d2c2 | F2BaB2c2 | d4A2B2 | c2d2B4 | A2B4
[V:4] B,2B,4F2 | B2A2B2E2 | F2F2B,4 | B,2EDC2B,2 | A,4B,2F4 | F2F4E2 | D4C2B,2 | A,2B,2F4 | F2B2A2B2 | E2F2F2B,4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Pembroke
M:C
L:1/8
Q:1/4=76
K:Bb
F2B4c2 | d2c2B2c2 | B2
% PHRASE_BREAK
A2B4 | F2G2A2B2
% PHRASE_BREAK
 | F2e2d2d2 | c2c2B2A2
% PHRASE_BREAK
 |
GFB4c2 | d2c2B2B2 | A2F2BAB2 | c2dcd2e2 | f4e2d2 | c2B2czd2 | c2B4', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (86, 'recW60YpY6z5AzYgt', 'Walton', 'LM (long meter, 88 88)', 'X:1
T:Walton
M:C
L:1/8
Q:1/4=76
K:Bb
F2F4B2 | B2A2G2F4 | d2
% PHRASE_BREAK
d2c2B2 | A4e2e2 | d2c2
% PHRASE_BREAK
B2c2 |
A2B4B2 | B2F2B4
% PHRASE_BREAK
 | A2B4c2 | F2G2A2B4 | B2B2A2G2 | c4A2AG | F2=E2F4
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 | s_1 :— :d | d :t_1 :l_1 | s_1 :— :m | m :r || :d | t_1 :— :f | f :m :r | d :r :t_1 | d :— || d | d || :s_1 | d :— :t_1 | d :— :r | s_1 :l_1 :t_1 | d :— || :d | d :t_1 :l_1 | r :— :t_1 | t_1.l_1:s_1 :fe_1 | s_1 :— ||","alto":":r_1 | m_1 :— :m_1 | f_1 :— :f_1 | s_1 :— :s_1 | l_1 :— || :l_1 | s_1 :— :t_1 | d :— :l_1 | s_1 :— :f_1 | m_1 :— || f_1 | m_1 || :s_1 | s_1 :— :s_1 | s_1 :— :l_1 | s_1 :— :f_1 | m_1 :— || :m_1 | fe_1 :— :fe_1 | s_1 :— :s_1 | m_1 :r_1 :r_1 | r_1 :— ||","tenor":":s_1 | s_1 :— :s_1 | s_1 :— :l_1.t_1 | d :— :d | l_1 :r || :f | r :— :r | d :— :r | m :f :r | d :— || l_1 | s_1 || :m | m :— :f | m :— :r | m :— :r | d :— || :d | r :— :r | r :— :r | d :t_1 :l_1 | t_1 :— ||","bass":":t_2 | d_1 :— :d_1 | r_1 :— :r_1 | m_1 :— :m_1 | f_1 :— || :f_1 | s_1 :— :s_1 | l_1 :— :f_1 | s_1 :— :s_1 | d_1 :— || f_1 | d_1 || :d_1 | d_1 :— :r_1 | m_1 :— .f_1 | s_1 :— :s_1 | d_1 :— || :l_1 | r_1 :— :d_1 | t_2 :— :t_2 | d_1 :r_1 :r_1 | s_1 :— ||"}', 'X:1
T:Walton
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2F4B2 | B2A2G2F4 | d2d2c2B2 | A4e2e2 | d2c2B2c2 | A2B4B2 | B2F2B4 | A2B4c2 | F2G2A2B4 | B2B2A2G2 | c4A2AG | F2=E2F4
[V:2] C2D4D2 | E4E2F4 | F2G4G2 | F4A2B4 | G2F4E2 | D4E2D2 | F2F4F2 | F4G2F4 | E2D4D2 | =E4=E2F4 | F2D2C2C2 | C4
[V:3] F2F4F2 | F4GAB4 | B2G2c2e2 | c4c2B4 | c2d2e2c2 | B4G2F2 | d2d4e2 | d4c2d4 | c2B4B2 | c4c2c4 | c2B2A2G2 | A4
[V:4] A,2B,4B,2 | C4C2D4 | D2E4E2 | F4F2G4 | E2F4F2 | B,4E2B,2 | B,2B,4C2 | D3EF4 | F2B,4G2 | C4B,2A,4 | A,2B,2C2C2 | F4', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, true, 'X:1
T:Walton
M:C
L:1/8
Q:1/4=76
K:Bb
F2F4B2 | B2A2G2F4 | d2
% PHRASE_BREAK
d2c2B2 | A4e2e2 | d2c2
% PHRASE_BREAK
B2c2 |
A2B4B2 | B2F2B4
% PHRASE_BREAK
 | A2B4c2 | F2G2A2B4 | B2B2A2G2 | c4A2AG | F2=E2F4
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (137, 'recnECPX2wQfKyDul', 'Wiltshire', 'CM', 'X:1
T:Wiltshire
M:C
L:1/8
Q:1/4=76
K:Bb
F2D2F2B2 | B2A2B2e2
% PHRASE_BREAK
 | d2c2c2d2 | F2F4
% PHRASE_BREAK
F2 | F2d2B2B2 |
A2c2B4
% PHRASE_BREAK
 | A2B4c2 | d2e2d2d2 | c2dBG4 | cBA3GA2 | B4B2B2
', NULL, '{"doh":"Bb","time":"C","soprano":":s_1 | m_1:s_1:d | d:t_1:d | f:m:r | r:m:s_1 | s_1:—:s_1 | s_1:m:d | d:t_1 || :r | d:—:t_1 | d:—:r | m:f:m | m:r:m.d | l_1:—:r.d | t_1:—.l_1:t_1 | d:— || d | d ||","alto":":m_1 | m_1:—:s_1 | s_1:f_1:m_1 | l_1:s_1:s_1 | f_1:m_1:m_1 | r_1:m_1:f_1 | m_1:—:s_1.l_1 | s_1:— || :f_1 | m_1:s_1:f_1 | m_1:s_1:— | s_1:—:s_1 | d:t_1:s_1 | s_1:f_1:l_1 | s_1:—.l_1:s_1.f_1 | m_1:— || f_1 | m_1 ||","tenor":":d | d:—:m | m:r:d | d:—:t_1 | t_1:d:s_1 | s_1:—:s_1 | d:s_1:d | m:r || :t_1 | d:—:r | d:—:t_1 | d:r:m.f | s:—:d | d:r.m:f | r:—.d:r | d:— || l_1 | s_1 ||","bass":":d_1 | d_1:m_1:d_1 | s_1:—:l_1 | f_1:s_1:s_1 | d_1:—:d_1 | t_2:d_1:r_1 | d_1:—:m_1.f_1 | s_1:— || :s_1 | d:m_1:s_1 | d_1:m_1:s_1 | d:t_1:d | s_1:—:m_1 | f_1:—:r_1 | s_1:—:s_1 | d_1:— || f_1 | d_1 ||"}', 'X:1
T:Wiltshire
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Bb
[V:1] F2D2F2B2 | B2A2B2e2 | d2c2c2d2 | F2F4F2 | F2d2B2B2 | A2c2B4 | A2B4c2 | d2e2d2d2 | c2dBG4 | cBA3GA2 | B4B2B2
[V:2] D2D4F2 | F2E2D2G2 | F2F2E2D2 | D2C2D2E2 | D4FGF4 | E2D2F2E2 | D2F4F4 | F2B2A2F2 | F2E2G2F3 | GFED4E2 | D2
[V:3] B2B4d2 | d2c2B2B4 | A2A2B2F2 | F4F2B2 | F2B2d2c2 | A2B4c2 | B4A2B2 | c2def4 | B2B2cde2 | c3Bc2B4 | G2F2
[V:4] B,2B,2D2B,2 | F4G2E2 | F2F2B,4 | B,2A,2B,2C2 | B,4DEF4 | F2B2D2F2 | B,2D2F2B2 | A2B2F4 | D2E4C2 | F4F2B,4 | E2B,2', NULL, NULL, NULL, 'https://youtu.be/NrPygqsp7Io?si=7kPxKLeJeqExg7uL', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Wiltshire
M:C
L:1/8
Q:1/4=76
K:Bb
F2D2F2B2 | B2A2B2e2
% PHRASE_BREAK
 | d2c2c2d2 | F2F4
% PHRASE_BREAK
F2 | F2d2B2B2 |
A2c2B4
% PHRASE_BREAK
 | A2B4c2 | d2e2d2d2 | c2dBG4 | cBA3GA2 | B4B2B2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (64, 'recO2riKTs8QysW8c', 'Martyrdom', 'CM', 'X:1
T:Martyrdom
M:C
L:1/8
Q:1/4=76
K:A
e2a4f2 | e4abc''4 | b2
% PHRASE_BREAK
a4c''2 | e''4c''2a4 | c''2
% PHRASE_BREAK
b4e''2 |
c''4b2a4 | c''2d''4c''2
% PHRASE_BREAK
 | b4c''2e2 | f2abc''4 | b2a4a2 | a2
', NULL, '{"doh":"A","time":"C","soprano":":s_1 | d :—:l_1 | s_1 :—:d.r | m :—:r | d :—:m | s :—:m | d :— :m | r :— || :s | m :—:r | d :—:m | f :—:m | r :—:m | s_1 :l_1 :d.r | m :—:r | d :— || d | d ||","alto":":m_1 | m_1 :—:f_1 | s_1 :—:m_1.f_1 | s_1 :—:s_1.f_1 | m_1 :—:s_1 | s_1 :—:s_1 | m_1 :—.f_1:s_1 | s_1 :— || :s_1 | s_1 :—:t_1 | d :—:ta_1 | l_1 :t_1:d | t_1 :—:s_1 | s_1 :f_1 :m_1.f_1 | s_1 :—:f_1 | m_1 :— || f_1 | m_1 ||","tenor":":d | d :s_1:l_1.t_1 | d :—:d | d :l_1:t_1 | d :—:d | t_1 :—:t_1 | d :— :d | t_1 :— || :r | d :—:f | m :—:d | d :r:m.f | s :—:d | d :— :d | d :l_1:t_1 | d :— || l_1 | s_1 ||","bass":":d_1 | d_1 :—:f_1 | m_1 :—:l_1 | s_1 :—:s_1 | d_1 :—:d_1 | m_1 :—:s_1 | l_1 :— :m_1 | s_1 :— || :t_1 | d :—:s_1 | l_1 :—:s_1 | f_1 :—:d_1 | s_1 :—:d | m_1 :f_1 :l_1 | s_1 :—:s_1 | d_1 :— || f_1 | d_1 ||"}', 'X:1
T:Martyrdom
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:A
[V:1] e2a4f2 | e4abc''4 | b2a4c''2 | e''4c''2a4 | c''2b4e''2 | c''4b2a4 | c''2d''4c''2 | b4c''2e2 | f2abc''4 | b2a4a2 | a2
[V:2] c2c4d2 | e4cde4 | edc4e2 | e4e2c3 | de2e4e2 | e4g2a4 | =g2f2^g2a2 | g4e2e2 | d2cde4 | d2c4d2 | c2
[V:3] a2a2e2fg | a4a2a2 | f2g2a4 | a2g4g2 | a4a2g4 | b2a4d''2 | c''4a2a2 | b2c''d''e''4 | a2a4a2 | a2f2g2a4 | f2e2
[V:4] A2A4d2 | c4f2e4 | e2A4A2 | c4e2f4 | c2e4g2 | a4e2f4 | e2d4A2 | e4a2c2 | d2f2e4 | e2A4d2 | A2', NULL, NULL, NULL, 'https://youtu.be/LPeKb7XBtrw?si=BMzKjXUEoL5VBKwi', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Martyrdom
M:C
L:1/8
Q:1/4=76
K:A
e2a4f2 | e4abc''4 | b2
% PHRASE_BREAK
a4c''2 | e''4c''2a4 | c''2
% PHRASE_BREAK
b4e''2 |
c''4b2a4 | c''2d''4c''2
% PHRASE_BREAK
 | b4c''2e2 | f2abc''4 | b2a4a2 | a2
', NULL);
INSERT INTO public.tunes (id, airtable_id, name, meter, abc_notation, abc_notation_legacy, solfege_ocr_text, abc_satb, score_jpg_url, solfege_jpg_url, additional_score_urls, youtube_url, soundcloud_url, precenting_comment, in_prca_psalter, has_famous_hymn, famous_hymn, number_in_1979_rp_psalter, num_in_prca_psalter, double_length, abc_notation_ocr, phrase_shape_override) VALUES (126, 'reciuCPykMkDzHJcQ', 'Franconia', 'SM', 'X:1
T:Franconia
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_d2e2=e2 | _g2e6
% PHRASE_BREAK
 | _g2a2=b2=e2 |
e2_d6
% PHRASE_BREAK
 | _g2=b2_b2a2 | _g2a2a2_g2
% PHRASE_BREAK
 | _g2=B2e2_d2 | _d2=B6
', NULL, '{"doh":"Eb","time":"C","soprano":":d | r :m | f :s | m :— | — :s | l :d'' | f :m | r :— | — || :s | d'' :t | l :s | l :l | s :s | d :m | r :r | d :— | — || d | d","alto":":s_1 | t_1 :d | d :t_1 | d :— | — :d | d :d | t_1 :d | t_1 :— | — || :t_1 | d :r | d :t_1 | m :r | t_1 :t_1 | d :d | d :t_1 | d :— | — || l_1 | s_1","tenor":":m | s :s | f :r | m :— | — :m | f :s | f :s | s :— | — || :s | s :s | m :s | s :fe | s :s | m :s | l :s | m :— | — || f | m","bass":":d | s_1 :d | l_1 :s_1 | d :— | — :d | f :m | r :d | s_1 :— | — || :s | m :s | d :m | d :r | s_1 :s_1 | l_1 :m_1 | f_1 :s_1 | d :— | — || f_1 | d"}', 'X:1
T:Franconia
M:C
L:1/8
Q:1/4=76
V:1 clef=treble name="Soprano"
V:2 clef=treble name="Alto"
V:3 clef=treble name="Tenor"
V:4 clef=bass name="Bass"
K:Eb
[V:1] =B2_d2e2=e2 | _g2e6 | _g2a2=b2=e2 | e2_d6 | _g2=b2_b2a2 | _g2a2a2_g2 | _g2=B2e2_d2 | _d2=B6
[V:2] _G2B2=B2=B2 | B2=B6 | =B2=B2=B2_B2 | =B2_B6 | B2=B2_d2=B2 | B2e2_d2B2 | B2=B2=B2=B2 | B2=B6
[V:3] e2_g2_g2=e2 | _d2e6 | e2=e2_g2=e2 | _g2_g6 | _g2_g2_g2e2 | _g2_g2f2_g2 | _g2e2_g2a2 | _g2e6
[V:4] =B2_G2=B2A2 | _G2=B6 | =B2=e2_e2_d2 | =B2_G6 | _g2e2_g2=B2 | e2=B2_d2_G2 | _G2A2E2=E2 | _G2=B6', NULL, NULL, NULL, 'https://www.youtube.com/watch?v=O9kv62CVsx8&ab_channel=WestminsterCovenanter', NULL, NULL, false, false, NULL, NULL, NULL, false, 'X:1
T:Franconia
M:C
L:1/8
Q:1/4=76
K:Eb
=B2_d2e2=e2 | _g2e6
% PHRASE_BREAK
 | _g2a2=b2=e2 |
e2_d6
% PHRASE_BREAK
 | _g2=b2_b2a2 | _g2a2a2_g2
% PHRASE_BREAK
 | _g2=B2e2_d2 | _d2=B6
', NULL);


--
-- Name: tunes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tunes_id_seq', 172, true);


--
-- PostgreSQL database dump complete
--

\unrestrict TQBHCbIO12KkqwU7QZb66KlD2b1FyqbvxO5wymRJgw2Jgvvua4uIy6jqyjwNEy5

