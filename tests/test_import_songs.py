import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime
from openpyxl import Workbook

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/import_songs.py'
spec = importlib.util.spec_from_file_location('import_songs', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.excel = self.root / 'songs.xlsx'
        self.output = self.root / 'songs.json'

    def workbook(self, rows, headers=None):
        book = Workbook()
        sheet = book.active
        sheet.append(headers or list(module.COLUMNS))
        for row in rows:
            sheet.append(row)
        book.save(self.excel)
        book.close()

    def run_import(self, *options):
        return subprocess.run([sys.executable, str(SCRIPT), str(self.excel),
                               '--output', str(self.output), *options], capture_output=True, text=True)

    def test_add_update_repeat_and_keep_missing_songs(self):
        self.workbook([['曲', '歌手', '', '中文', 'https://www.instagram.com/reel/one/', datetime(2026, 10, 10), '作品']])
        self.assertEqual(self.run_import().returncode, 0)
        songs = json.loads(self.output.read_text())
        self.assertEqual(songs[0]['date'], '2026-10-10')
        self.assertIn('未變更 1 首', self.run_import().stdout)
        self.workbook([['新曲名', '歌手', 'https://instagram.com/reel/one/?utm_source=test'],
                       ['另一曲', '另一歌手', 'https://www.instagram.com/reel/two/']],
                      ['title', 'artist', 'instagram_url'])
        preview = self.run_import('--dry-run')
        self.assertEqual(preview.returncode, 0)
        self.assertEqual(json.loads(self.output.read_text()), songs)
        self.assertEqual(self.run_import().returncode, 0)
        songs = json.loads(self.output.read_text())
        self.assertEqual(len(songs), 2)
        self.assertEqual(songs[0]['title'], '新曲名')
        self.assertEqual(songs[0]['zh'], '中文')
        self.workbook([['另一曲', '另一歌手', 'https://www.instagram.com/reel/two/']],
                      ['title', 'artist', 'instagram_url'])
        self.assertEqual(self.run_import().returncode, 0)
        self.assertEqual(len(json.loads(self.output.read_text())), 2)

    def test_invalid_input_never_overwrites_output(self):
        self.output.write_text('[]\n')
        invalid_rows = [
            [['曲', '', '', '', 'https://www.instagram.com/reel/one/', '', '']],
            [['曲', '歌手', '', '', 'javascript:alert(1)', '', '']],
            [['曲', '歌手', '', '', 'https://www.instagram.com/reel/one/', '2026-02-30', '']],
            [['=1+1', '歌手', '', '', 'https://www.instagram.com/reel/one/', '', '']],
            [['曲', '歌手', '', '', 'https://www.instagram.com/reel/one/', '', '']] * 2,
        ]
        for rows in invalid_rows:
            with self.subTest(rows=rows):
                self.workbook(rows)
                self.assertNotEqual(self.run_import().returncode, 0)
                self.assertEqual(self.output.read_text(), '[]\n')

    def test_missing_header_and_empty_file(self):
        self.workbook([['曲']], ['title'])
        self.assertNotEqual(self.run_import().returncode, 0)
        self.workbook([])
        self.assertNotEqual(self.run_import().returncode, 0)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
