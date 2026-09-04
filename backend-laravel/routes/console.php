<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('sams:backup', function () {
    $stamp = now()->format('Ymd-His');
    $backupRoot = storage_path('app/private/backups');
    File::ensureDirectoryExists($backupRoot);

    $connection = config('database.default');
    $database = config("database.connections.{$connection}");
    $databaseFile = $backupRoot . "/database-{$stamp}.sql";

    if ($connection === 'sqlite') {
        $source = $database['database'];
        if (! is_file($source)) {
            $this->error("SQLite database file not found: {$source}");
            return 1;
        }
        copy($source, $backupRoot . "/database-{$stamp}.sqlite");
    } elseif ($connection === 'mysql') {
        $process = new Process([
            'mysqldump', '--host=' . $database['host'], '--port=' . $database['port'],
            '--user=' . $database['username'], $database['database'],
        ], base_path(), ['MYSQL_PWD' => (string) $database['password']]);
        $process->run(function ($type, $buffer) use ($databaseFile): void {
            if ($type === Process::OUT) {
                File::append($databaseFile, $buffer);
            }
        });
        if (! $process->isSuccessful()) {
            File::delete($databaseFile);
            $this->error('Database backup failed. Confirm mysqldump is installed and credentials are valid.');
            return 1;
        }
    } else {
        $this->error("Unsupported database connection: {$connection}");
        return 1;
    }

    $manifest = [
        'created_at' => now()->toIso8601String(),
        'database_connection' => $connection,
        'application' => config('app.name'),
        'documents_path' => storage_path('app/private/documents'),
    ];
    File::put($backupRoot . "/manifest-{$stamp}.json", json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    $documentsRoot = storage_path('app/private/documents');
    if (class_exists(\ZipArchive::class) && is_dir($documentsRoot)) {
        $archive = new \ZipArchive();
        $archivePath = $backupRoot . "/documents-{$stamp}.zip";
        if ($archive->open($archivePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            foreach (File::allFiles($documentsRoot) as $file) {
                $archive->addFile($file->getPathname(), $file->getRelativePathname());
            }
            $archive->close();
        }
    }
    $this->info("Database backup created in {$backupRoot}");
    return 0;
})->purpose('Create a timestamped database backup for school operations');
