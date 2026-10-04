-- One-off data fix (run by hand, after reviewing).
--
-- Match cmobga98f000004l8l4e8x2id: substitution batch
-- b88fb600-4265-472b-b284-db73a0acebc4 was saved twice, 4 seconds apart
-- (07:54:37 and 07:54:41 UTC on 2026-05-03), so the play-by-play shows the same
-- swap twice. The migration removes the duplicate substitution row; this marks
-- the second pair of SUBSTITUTION events undone (not deleted, so it can be
-- reversed by setting is_undone back to 0).

UPDATE `match_events`
SET `is_undone` = 1, `undone_at` = NOW()
WHERE `id` IN ('cmoph65fs000204k20jmm5m2k', 'cmoph65fs000304k2jsyn1x5j')
  AND `match_id` = 'cmobga98f000004l8l4e8x2id';
