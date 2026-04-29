<?php

declare(strict_types=1);

// CORS headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

/**
 * Send a standardized JSON response.
 */
function send_json(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Build a consistent success payload.
 */
function success_response(mixed $data): array
{
    return [
        'success' => true,
        'data' => $data,
    ];
}

/**
 * Build a consistent error payload.
 */
function error_response(string $message): array
{
    return [
        'success' => false,
        'error' => $message,
    ];
}

/**
 * Keep names filesystem safe and compatible with future routes.
 */
function sanitize_name(string $value): string
{
    $value = str_replace(["\0", '/', '\\', '..'], '', $value);
    $value = preg_replace('/[^a-zA-Z0-9_\-\s]/', '', $value) ?? '';
    return trim($value);
}

/**
 * Resolve project vault root and ensure it exists.
 */
function get_vault_root(): string
{
    $base = realpath(__DIR__ . '/../');
    if ($base === false) {
        send_json(500, error_response('Failed to resolve API base path'));
    }

    $vaultRoot = $base . DIRECTORY_SEPARATOR . 'vaults';
    if (!is_dir($vaultRoot) && !mkdir($vaultRoot, 0775, true) && !is_dir($vaultRoot)) {
        send_json(500, error_response('Failed to initialize vault storage'));
    }

    return $vaultRoot;
}

/**
 * Verify a resolved path never escapes the vault root.
 */
function is_inside_root(string $path, string $root): bool
{
    $normalizedPath = rtrim(str_replace('\\', '/', $path), '/');
    $normalizedRoot = rtrim(str_replace('\\', '/', $root), '/');
    return str_starts_with($normalizedPath . '/', $normalizedRoot . '/');
}

/**
 * Read and decode JSON request payload.
 */
function read_json_body(): array
{
    $rawInput = file_get_contents('php://input');
    if ($rawInput === false || $rawInput === '') {
        return [];
    }

    $decoded = json_decode($rawInput, true);
    if (!is_array($decoded)) {
        send_json(400, error_response('Invalid JSON body'));
    }

    return $decoded;
}

/**
 * Ensure vault notes directory exists and is safe.
 */
function get_notes_root(string $vaultRoot, string $vaultName): string
{
    $cleanVaultName = sanitize_name($vaultName);
    if ($cleanVaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $notesRoot = $vaultRoot . DIRECTORY_SEPARATOR . $cleanVaultName . DIRECTORY_SEPARATOR . 'notes';
    if (!is_dir($notesRoot)) {
        send_json(404, error_response('Vault notes directory not found'));
    }

    $resolved = realpath($notesRoot);
    if ($resolved === false || !is_inside_root($resolved, $vaultRoot)) {
        send_json(400, error_response('Invalid notes path'));
    }

    return $resolved;
}

/**
 * Convert a user path into safe normalized note/folder segments.
 */
function sanitize_path_segments(string $path): array
{
    $parts = array_values(array_filter(explode('/', trim($path, '/')), 'strlen'));
    $cleanParts = [];

    foreach ($parts as $part) {
        $cleanPart = trim($part);
        if (
            $cleanPart === ''
            || $cleanPart === '.'
            || $cleanPart === '..'
            || str_contains($cleanPart, "\0")
            || str_contains($cleanPart, '/')
            || str_contains($cleanPart, '\\')
            || preg_match('/[^a-zA-Z0-9_.\-\s\(\)]/', $cleanPart) === 1
        ) {
            send_json(400, error_response('Invalid path segment'));
        }
        $cleanParts[] = $cleanPart;
    }

    return $cleanParts;
}

/**
 * Resolve a target path under notes root and verify directory boundary.
 */
function resolve_under_notes_root(string $notesRoot, string $relativePath, bool $requireExisting = false): string
{
    $segments = sanitize_path_segments($relativePath);
    if (count($segments) === 0) {
        send_json(400, error_response('Path is required'));
    }

    $targetPath = $notesRoot . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $segments);
    if ($requireExisting) {
        $resolved = realpath($targetPath);
        if ($resolved === false) {
            send_json(404, error_response('Path not found'));
        }

        if (!is_inside_root($resolved, $notesRoot)) {
            send_json(400, error_response('Path escapes notes root'));
        }

        return $resolved;
    }

    $parent = dirname($targetPath);
    $resolvedParent = realpath($parent);
    if ($resolvedParent === false || !is_inside_root($resolvedParent, $notesRoot)) {
        send_json(400, error_response('Invalid target parent path'));
    }

    return $targetPath;
}

/**
 * Build recursive folder tree and note listing.
 */
function build_tree_node(string $folderPath, string $rootPath): array
{
    $folderName = basename($folderPath);
    $relative = ltrim(str_replace(str_replace('\\', '/', $rootPath), '', str_replace('\\', '/', $folderPath)), '/');

    $childrenFolders = [];
    $notes = [];
    $entries = scandir($folderPath);
    if ($entries === false) {
        return [
            'name' => $folderName,
            'path' => $relative,
            'folders' => [],
            'notes' => [],
        ];
    }

    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }

        $full = $folderPath . DIRECTORY_SEPARATOR . $entry;
        if (is_dir($full)) {
            $childrenFolders[] = build_tree_node($full, $rootPath);
            continue;
        }

        if (is_file($full) && str_ends_with(strtolower($entry), '.md')) {
            $noteRelative = ltrim(str_replace(str_replace('\\', '/', $rootPath), '', str_replace('\\', '/', $full)), '/');
            $notes[] = [
                'name' => pathinfo($entry, PATHINFO_FILENAME),
                'fileName' => $entry,
                'path' => $noteRelative,
            ];
        }
    }

    usort($childrenFolders, static fn(array $a, array $b): int => strcasecmp($a['name'], $b['name']));
    usort($notes, static fn(array $a, array $b): int => strcasecmp($a['name'], $b['name']));

    return [
        'name' => $folderName === 'notes' ? 'Root' : $folderName,
        'path' => $relative,
        'folders' => $childrenFolders,
        'notes' => $notes,
    ];
}

/**
 * Update or insert a simple title frontmatter field.
 */
function update_note_title_frontmatter(string $content, string $title): string
{
    $quotedTitle = json_encode($title, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($quotedTitle === false) {
        $quotedTitle = '"' . addslashes($title) . '"';
    }

    if (preg_match('/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/', $content, $matches) === 1) {
        $frontmatter = (string) $matches[1];
        $body = (string) ($matches[2] ?? '');

        if (preg_match('/^title:\s*.*$/m', $frontmatter) === 1) {
            $frontmatter = (string) preg_replace('/^title:\s*.*$/m', 'title: ' . $quotedTitle, $frontmatter, 1);
        } else {
            $frontmatter = trim($frontmatter) === ''
                ? 'title: ' . $quotedTitle
                : 'title: ' . $quotedTitle . "\n" . $frontmatter;
        }

        return "---\n" . rtrim($frontmatter, "\n") . "\n---\n" . ltrim($body, "\n");
    }

    return "---\ntitle: " . $quotedTitle . "\n---\n\n" . $content;
}

/**
 * Rename a note and keep its title metadata in sync.
 */
function rename_note_in_place(string $notesDir, string $resolvedNote, string $newName): string
{
    $cleanName = sanitize_name($newName);
    if ($cleanName === '') {
        send_json(400, error_response('New note name is required'));
    }

    $targetDir = dirname($resolvedNote);
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $cleanName . '.md';
    if (realpath($targetPath) !== false) {
        send_json(400, error_response('Target note already exists'));
    }

    $content = file_get_contents($resolvedNote);
    if ($content === false) {
        send_json(500, error_response('Failed to read note'));
    }

    $updatedContent = update_note_title_frontmatter($content, $cleanName);
    if (!rename($resolvedNote, $targetPath)) {
        send_json(500, error_response('Failed to rename note'));
    }

    if (file_put_contents($targetPath, $updatedContent) === false) {
        send_json(500, error_response('Failed to rewrite renamed note'));
    }

    return ltrim(str_replace(str_replace('\\', '/', $notesDir), '', str_replace('\\', '/', $targetPath)), '/');
}

/**
 * Rename a folder within the notes tree.
 */
function rename_folder_in_place(string $notesDir, string $resolvedFolder, string $newName): string
{
    $cleanName = sanitize_name($newName);
    if ($cleanName === '') {
        send_json(400, error_response('New folder name is required'));
    }

    $targetDir = dirname($resolvedFolder);
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $cleanName;
    if (realpath($targetPath) !== false) {
        send_json(400, error_response('Target folder already exists'));
    }

    if (!rename($resolvedFolder, $targetPath)) {
        send_json(500, error_response('Failed to rename folder'));
    }

    return ltrim(str_replace(str_replace('\\', '/', $notesDir), '', str_replace('\\', '/', $targetPath)), '/');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '/api/index.php';

// Handle both production (nginx/apache) and dev (php -S) setups
if (str_starts_with($requestPath, $scriptName)) {
    // Production: /api/index.php/vaults -> /vaults
    $requestPath = substr($requestPath, strlen($scriptName));
} elseif (str_starts_with($requestPath, '/api/')) {
    // Dev with proxy: /api/vaults -> /vaults
    $requestPath = substr($requestPath, 5); // Remove '/api'
}

$requestPath = '/' . ltrim($requestPath, '/');
$segments = array_values(array_filter(explode('/', trim($requestPath, '/')), 'strlen'));
$segments = array_map('urldecode', $segments); // Decode URL-encoded path segments

if (($segments[0] ?? '') !== 'vaults') {
    send_json(404, error_response('Route not found'));
}

if ($method === 'GET' && count($segments) === 1) {
    $vaultRoot = get_vault_root();
    $entries = scandir($vaultRoot);
    if ($entries === false) {
        send_json(500, error_response('Failed to read vault directory'));
    }

    $vaults = [];
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }

        $cleanName = sanitize_name($entry);
        if ($cleanName === '') {
            continue;
        }

        $fullPath = $vaultRoot . DIRECTORY_SEPARATOR . $cleanName;
        $resolved = realpath($fullPath);

        if ($resolved === false || !is_dir($resolved)) {
            continue;
        }

        if (!is_inside_root($resolved, $vaultRoot)) {
            continue;
        }

        $vaults[] = $cleanName;
    }

    sort($vaults, SORT_NATURAL | SORT_FLAG_CASE);
    send_json(200, success_response($vaults));
}

if ($method === 'POST' && count($segments) === 1) {
    $vaultRoot = get_vault_root();
    $payload = read_json_body();
    $vaultName = sanitize_name((string) ($payload['name'] ?? ''));

    if ($vaultName === '') {
        send_json(400, error_response('Vault name is required'));
    }

    $vaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName;
    if (file_exists($vaultPath)) {
        send_json(400, error_response("Vault '{$vaultName}' already exists"));
    }

    if (!mkdir($vaultPath, 0775, true) || !is_dir($vaultPath)) {
        send_json(500, error_response('Failed to create vault'));
    }

    $notesPath = $vaultPath . DIRECTORY_SEPARATOR . 'notes';
    if (!mkdir($notesPath, 0775, true) || !is_dir($notesPath)) {
        send_json(500, error_response('Failed to initialize vault notes directory'));
    }

    $metaPath = $vaultPath . DIRECTORY_SEPARATOR . 'meta.json';
    $metaPayload = [
        'name' => $vaultName,
        'created_at' => gmdate(DATE_ATOM),
        'pinned_notes' => [],
    ];
    file_put_contents($metaPath, json_encode($metaPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    // Create a default welcome note
    $welcomeNotePath = $notesPath . DIRECTORY_SEPARATOR . 'Welcome.md';
    $welcomeContent = <<<MD
---
title: Welcome to VaultNote
tags: [welcome, getting-started]
created: {gmdate(DATE_ATOM)}
---

# Welcome to VaultNote

This is your new vault. Here are some quick tips to get started:

## Creating Notes

- Right-click on folders to create new notes
- Use the **New note** option in the context menu
- Notes are stored as Markdown files

## Organizing with Folders

- Create folders to organize your notes
- Drag and drop to move notes between folders
- Use the sidebar to navigate your vault

## Wiki Links

- Use `[[Note Name]]` to link to other notes
- Click on wiki links to navigate between notes
- The graph view shows all note connections

## Keyboard Shortcuts

- `Ctrl+S` - Save note
- `Ctrl+E` - Edit mode
- `Ctrl+P` - Preview mode
- `Ctrl+Shift+E` - Split view
- `Ctrl+K` - Search
- `Ctrl+G` - Graph view

Happy note-taking! 📝
MD;
    file_put_contents($welcomeNotePath, $welcomeContent);

    send_json(201, success_response($vaultName));
}

if ($method === 'DELETE' && count($segments) === 2) {
    $vaultRoot = get_vault_root();
    $vaultName = sanitize_name($segments[1]);
    if ($vaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $vaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName;
    if (!is_dir($vaultPath)) {
        send_json(404, error_response("Vault '{$vaultName}' not found"));
    }

    // Recursively delete vault directory
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($vaultPath, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($files as $fileinfo) {
        $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
        $todo($fileinfo->getRealPath());
    }

    if (!rmdir($vaultPath)) {
        send_json(500, error_response('Failed to delete vault directory'));
    }

    send_json(200, success_response(['deleted' => $vaultName]));
}

if ($method === 'PATCH' && count($segments) === 2) {
    $vaultRoot = get_vault_root();
    $oldVaultName = sanitize_name($segments[1]);
    if ($oldVaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $payload = read_json_body();
    $newVaultName = sanitize_name((string) ($payload['name'] ?? ''));
    if ($newVaultName === '') {
        send_json(400, error_response('New vault name is required'));
    }

    if ($oldVaultName === $newVaultName) {
        send_json(200, success_response(['name' => $newVaultName]));
    }

    $oldVaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $oldVaultName;
    $newVaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $newVaultName;

    if (!is_dir($oldVaultPath)) {
        send_json(404, error_response("Vault '{$oldVaultName}' not found"));
    }

    if (is_dir($newVaultPath)) {
        send_json(400, error_response("Vault '{$newVaultName}' already exists"));
    }

    if (!rename($oldVaultPath, $newVaultPath)) {
        send_json(500, error_response('Failed to rename vault'));
    }

    // Update meta.json with new name
    $metaPath = $newVaultPath . DIRECTORY_SEPARATOR . 'meta.json';
    if (is_file($metaPath)) {
        $metaContent = file_get_contents($metaPath);
        $meta = json_decode($metaContent, true) ?: [];
        $meta['name'] = $newVaultName;
        file_put_contents($metaPath, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    send_json(200, success_response(['name' => $newVaultName]));
}

if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'meta') {
    $vaultRoot = get_vault_root();
    $vaultName = sanitize_name($segments[1]);
    if ($vaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $metaPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName . DIRECTORY_SEPARATOR . 'meta.json';
    if (!is_file($metaPath)) {
        send_json(404, error_response('Vault meta not found'));
    }

    $metaContent = file_get_contents($metaPath);
    if ($metaContent === false) {
        send_json(500, error_response('Failed to read vault meta'));
    }

    $meta = json_decode($metaContent, true);
    if (!is_array($meta)) {
        send_json(500, error_response('Invalid vault meta format'));
    }

    send_json(200, success_response($meta));
}

if ($method === 'PUT' && count($segments) === 3 && $segments[2] === 'meta') {
    $vaultRoot = get_vault_root();
    $vaultName = sanitize_name($segments[1]);
    if ($vaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $metaPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName . DIRECTORY_SEPARATOR . 'meta.json';
    if (!is_file($metaPath)) {
        send_json(404, error_response('Vault meta not found'));
    }

    $payload = read_json_body();
    $pinnedNotes = $payload['pinned_notes'] ?? null;
    if (!is_array($pinnedNotes)) {
        send_json(400, error_response('pinned_notes must be an array'));
    }

    $sanitizedPins = [];
    foreach ($pinnedNotes as $pin) {
        if (!is_string($pin)) {
            continue;
        }
        $segmentsSafe = sanitize_path_segments($pin);
        if (count($segmentsSafe) === 0) {
            continue;
        }
        $candidate = implode('/', $segmentsSafe);
        if (!str_ends_with(strtolower($candidate), '.md')) {
            continue;
        }
        $sanitizedPins[] = $candidate;
    }
    $sanitizedPins = array_values(array_unique($sanitizedPins));

    $current = json_decode((string) file_get_contents($metaPath), true);
    if (!is_array($current)) {
        $current = ['name' => $vaultName, 'created_at' => gmdate(DATE_ATOM)];
    }
    $current['pinned_notes'] = $sanitizedPins;
    $current['updated_at'] = gmdate(DATE_ATOM);

    $written = file_put_contents($metaPath, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    if ($written === false) {
        send_json(500, error_response('Failed to update vault meta'));
    }

    send_json(200, success_response($current));
}

if ($method === 'GET' && count($segments) === 3 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $tree = build_tree_node($notesDir, $notesDir);
    send_json(200, success_response($tree));
}

if ($method === 'GET' && count($segments) >= 4 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3));
    $resolvedNote = resolve_under_notes_root($notesDir, $notePath, true);

    if (!is_file($resolvedNote) || !str_ends_with(strtolower($resolvedNote), '.md')) {
        send_json(404, error_response('Note not found'));
    }

    $content = file_get_contents($resolvedNote);
    if ($content === false) {
        send_json(500, error_response('Failed to read note'));
    }

    send_json(200, success_response([
        'path' => ltrim(str_replace(str_replace('\\', '/', $notesDir), '', str_replace('\\', '/', $resolvedNote)), '/'),
        'content' => $content,
    ]));
}

if ($method === 'POST' && count($segments) >= 4 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3));
    $targetNote = resolve_under_notes_root($notesDir, $notePath, false);

    if (!str_ends_with(strtolower($targetNote), '.md')) {
        send_json(400, error_response('Only .md notes are allowed'));
    }
    if (file_exists($targetNote)) {
        send_json(400, error_response('Note already exists'));
    }

    $payload = read_json_body();
    $content = (string) ($payload['content'] ?? '');
    $created = file_put_contents($targetNote, $content);
    if ($created === false) {
        send_json(500, error_response('Failed to create note'));
    }

    send_json(201, success_response(['path' => $notePath]));
}

if ($method === 'PATCH' && count($segments) >= 4 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3));
    $resolvedNote = resolve_under_notes_root($notesDir, $notePath, true);

    if (!is_file($resolvedNote) || !str_ends_with(strtolower($resolvedNote), '.md')) {
        send_json(404, error_response('Note not found'));
    }

    $payload = read_json_body();
    $newName = (string) ($payload['name'] ?? '');
    $renamedPath = rename_note_in_place($notesDir, $resolvedNote, $newName);

    send_json(200, success_response(['path' => $renamedPath]));
}

if ($method === 'PUT' && count($segments) >= 4 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3));
    $targetNote = resolve_under_notes_root($notesDir, $notePath, true);

    if (!is_file($targetNote) || !str_ends_with(strtolower($targetNote), '.md')) {
        send_json(404, error_response('Note not found'));
    }

    $payload = read_json_body();
    $content = (string) ($payload['content'] ?? '');
    $updated = file_put_contents($targetNote, $content);
    if ($updated === false) {
        send_json(500, error_response('Failed to update note'));
    }

    send_json(200, success_response(['path' => $notePath]));
}

if ($method === 'DELETE' && count($segments) >= 4 && $segments[2] === 'notes') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3));
    $targetNote = resolve_under_notes_root($notesDir, $notePath, true);

    if (!is_file($targetNote) || !str_ends_with(strtolower($targetNote), '.md')) {
        send_json(404, error_response('Note not found'));
    }

    if (!unlink($targetNote)) {
        send_json(500, error_response('Failed to delete note'));
    }

    send_json(200, success_response(['path' => $notePath]));
}

if ($method === 'POST' && count($segments) === 3 && $segments[2] === 'folders') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $payload = read_json_body();
    $folderPath = (string) ($payload['path'] ?? '');
    $targetFolder = resolve_under_notes_root($notesDir, $folderPath, false);

    error_log("Creating folder: notesDir=$notesDir, folderPath=$folderPath, targetFolder=$targetFolder");

    if (file_exists($targetFolder)) {
        send_json(400, error_response('Folder already exists'));
    }

    $parentDir = dirname($targetFolder);
    error_log("Parent dir: $parentDir, exists: " . (is_dir($parentDir) ? 'yes' : 'no'));

    if (!is_dir($parentDir) && !mkdir($parentDir, 0775, true)) {
        error_log("Failed to create parent directory: $parentDir");
        send_json(500, error_response('Failed to create parent directory'));
    }

    if (!mkdir($targetFolder, 0775, true) || !is_dir($targetFolder)) {
        error_log("Failed to create folder: $targetFolder, error: " . error_get_last()['message'] ?? 'unknown');
        send_json(500, error_response('Failed to create folder: ' . $targetFolder));
    }

    send_json(201, success_response(['path' => $folderPath]));
}

if ($method === 'PATCH' && count($segments) >= 4 && $segments[2] === 'folders') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $folderPath = implode('/', array_slice($segments, 3));
    $resolvedFolder = resolve_under_notes_root($notesDir, $folderPath, true);

    if (!is_dir($resolvedFolder)) {
        send_json(404, error_response('Folder not found'));
    }

    $payload = read_json_body();
    $newName = (string) ($payload['name'] ?? '');
    $renamedPath = rename_folder_in_place($notesDir, $resolvedFolder, $newName);

    send_json(200, success_response(['path' => $renamedPath]));
}

if ($method === 'DELETE' && count($segments) >= 4 && $segments[2] === 'folders') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $folderPath = implode('/', array_slice($segments, 3));
    $targetFolder = resolve_under_notes_root($notesDir, $folderPath, true);

    if (!is_dir($targetFolder)) {
        send_json(404, error_response('Folder not found'));
    }

    $contents = scandir($targetFolder);
    if ($contents === false) {
        send_json(500, error_response('Failed to inspect folder'));
    }
    if (count($contents) > 2) {
        send_json(400, error_response('Folder is not empty'));
    }

    if (!rmdir($targetFolder)) {
        send_json(500, error_response('Failed to delete folder'));
    }

    send_json(200, success_response(['path' => $folderPath]));
}

if ($method === 'POST' && count($segments) >= 4 && $segments[2] === 'notes' && end($segments) === 'move') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $notePath = implode('/', array_slice($segments, 3, -1));
    $resolvedNote = resolve_under_notes_root($notesDir, $notePath, true);

    if (!is_file($resolvedNote) || !str_ends_with(strtolower($resolvedNote), '.md')) {
        send_json(404, error_response('Note not found'));
    }

    $payload = read_json_body();
    $targetPath = (string) ($payload['targetPath'] ?? '');
    if ($targetPath === '') {
        send_json(400, error_response('Target path is required'));
    }

    $resolvedTarget = resolve_under_notes_root($notesDir, $targetPath, false);
    $targetDir = dirname($resolvedTarget);
    $resolvedTargetDir = realpath($targetDir);
    if ($resolvedTargetDir === false || !is_inside_root($resolvedTargetDir, $notesDir)) {
        send_json(400, error_response('Invalid target directory'));
    }

    $noteName = basename($resolvedNote);
    $finalTarget = $resolvedTargetDir . DIRECTORY_SEPARATOR . $noteName;
    if (realpath($finalTarget) !== false) {
        send_json(400, error_response('Target note already exists'));
    }

    if (!rename($resolvedNote, $finalTarget)) {
        send_json(500, error_response('Failed to move note'));
    }

    $newRelativePath = ltrim(str_replace(str_replace('\\', '/', $notesDir), '', str_replace('\\', '/', $finalTarget)), '/');
    send_json(200, success_response(['path' => $newRelativePath]));
}

if ($method === 'POST' && count($segments) >= 4 && $segments[2] === 'folders' && end($segments) === 'move') {
    $vaultRoot = get_vault_root();
    $notesDir = get_notes_root($vaultRoot, $segments[1]);
    $folderPath = implode('/', array_slice($segments, 3, -1));
    $resolvedFolder = resolve_under_notes_root($notesDir, $folderPath, true);

    if (!is_dir($resolvedFolder)) {
        send_json(404, error_response('Folder not found'));
    }

    $payload = read_json_body();
    $targetPath = (string) ($payload['targetPath'] ?? '');
    if ($targetPath === '') {
        send_json(400, error_response('Target path is required'));
    }

    $resolvedTarget = resolve_under_notes_root($notesDir, $targetPath, false);
    $targetDir = dirname($resolvedTarget);
    $resolvedTargetDir = realpath($targetDir);
    if ($resolvedTargetDir === false || !is_inside_root($resolvedTargetDir, $notesDir)) {
        send_json(400, error_response('Invalid target directory'));
    }

    $folderName = basename($resolvedFolder);
    $finalTarget = $resolvedTargetDir . DIRECTORY_SEPARATOR . $folderName;
    if (realpath($finalTarget) !== false) {
        send_json(400, error_response('Target folder already exists'));
    }

    if (!rename($resolvedFolder, $finalTarget)) {
        send_json(500, error_response('Failed to move folder'));
    }

    $newRelativePath = ltrim(str_replace(str_replace('\\', '/', $notesDir), '', str_replace('\\', '/', $finalTarget)), '/');
    send_json(200, success_response(['path' => $newRelativePath]));
}

if ($method === 'POST' && count($segments) === 4 && $segments[2] === 'images' && $segments[3] === 'upload') {
    $vaultRoot = get_vault_root();
    $vaultName = sanitize_name($segments[1]);
    if ($vaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $vaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName;
    if (!is_dir($vaultPath)) {
        send_json(404, error_response('Vault not found'));
    }

    $imagesDir = $vaultPath . DIRECTORY_SEPARATOR . 'images';
    if (!is_dir($imagesDir) && !mkdir($imagesDir, 0775, true) && !is_dir($imagesDir)) {
        send_json(500, error_response('Failed to create images directory'));
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        send_json(400, error_response('No valid image file uploaded'));
    }

    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        send_json(400, error_response('Invalid image type'));
    }

    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        send_json(400, error_response('Image too large (max 10MB)'));
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
    $targetPath = $imagesDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        send_json(500, error_response('Failed to save image'));
    }

    $imageUrl = '/vaults/' . urlencode($vaultName) . '/images/' . urlencode($filename);
    send_json(201, success_response(['url' => $imageUrl]));
}

if ($method === 'DELETE' && count($segments) >= 4 && $segments[2] === 'images') {
    $vaultRoot = get_vault_root();
    $vaultName = sanitize_name($segments[1]);
    if ($vaultName === '') {
        send_json(400, error_response('Invalid vault name'));
    }

    $filename = sanitize_name($segments[3] ?? '');
    if ($filename === '') {
        send_json(400, error_response('Invalid filename'));
    }

    $vaultPath = $vaultRoot . DIRECTORY_SEPARATOR . $vaultName;
    $imagesDir = $vaultPath . DIRECTORY_SEPARATOR . 'images';
    $targetPath = $imagesDir . DIRECTORY_SEPARATOR . $filename;

    if (!is_file($targetPath)) {
        send_json(404, error_response('Image not found'));
    }

    if (!unlink($targetPath)) {
        send_json(500, error_response('Failed to delete image'));
    }

    send_json(200, success_response(['deleted' => true]));
}

send_json(404, error_response('Route not found'));
