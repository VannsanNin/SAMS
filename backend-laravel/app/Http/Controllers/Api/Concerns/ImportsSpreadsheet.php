<?php

namespace App\Http\Controllers\Api\Concerns;

use ZipArchive;

trait ImportsSpreadsheet
{
    protected function readRows($file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());
        return $ext === 'xlsx' ? $this->readXlsxRows($file->getRealPath()) : $this->readCsvRows($file);
    }

    private function readCsvRows($file): array
    {
        $fh = fopen($file->getRealPath(), 'r');
        if ($fh === false) {
            throw new \RuntimeException('Could not open the file.');
        }

        $rows = [];
        while (($row = fgetcsv($fh)) !== false) {
            $rows[] = $row;
        }
        fclose($fh);

        return $rows;
    }

    private function readXlsxRows(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \RuntimeException('Could not open the Excel file.');
        }

        $shared = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $sx = new \SimpleXMLElement($sharedXml);
            foreach ($sx->si as $si) {
                $parts = [];
                foreach ($si->t as $t) {
                    $parts[] = (string) $t;
                }
                $shared[] = implode('', $parts);
            }
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();
            throw new \RuntimeException('No worksheet found in the Excel file.');
        }

        $rows = [];
        $sheet = new \SimpleXMLElement($sheetXml);
        foreach ($sheet->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $c) {
                $ref = (string) $c['r'];
                $col = preg_replace('/\d+/', '', $ref);
                $idx = 0;
                foreach (str_split($col) as $ch) {
                    $idx = $idx * 26 + (ord($ch) - 64);
                }
                $idx -= 1;

                $value = isset($c->v) ? (string) $c->v : '';
                if (isset($c['t']) && (string) $c['t'] === 's') {
                    $value = $shared[(int) $value] ?? '';
                }
                $cells[$idx] = $value;
            }
            ksort($cells);
            $rows[] = array_values($cells);
        }
        $zip->close();

        return $rows;
    }

    private function rowToRecord(array $row, array $header): array
    {
        $record = [];
        foreach ($header as $i => $field) {
            $record[$field] = isset($row[$i]) ? trim((string) $row[$i]) : '';
        }

        return $record;
    }

    private function normalizeHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header);
        $header = strtolower(trim($header));

        $aliases = $this->headerAliases();

        return $aliases[$header] ?? preg_replace('/[^a-z0-9_]/', '_', $header);
    }

    protected function headerAliases(): array
    {
        return [];
    }
}
