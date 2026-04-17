<?php declare(strict_types=1);

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
        $cleanPart = sanitize_name($part);
        if ($cleanPart === '') {
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

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '/api/index.php';

if (str_starts_with($requestPath, $scriptName)) {
    $requestPath = substr($requestPath, strlen($scriptName));
}

$requestPath = '/' . ltrim($requestPath, '/');
$segments = array_values(array_filter(explode('/', trim($requestPath, '/')), 'strlen'));

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
        send_json(400, error_response('Vault already exists'));
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

    send_json(201, success_response($vaultName));
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

    if (file_exists($targetFolder)) {
        send_json(400, error_response('Folder already exists'));
    }

    if (!mkdir($targetFolder, 0775, true) || !is_dir($targetFolder)) {
        send_json(500, error_response('Failed to create folder'));
    }

    send_json(201, success_response(['path' => $folderPath]));
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

send_json(404, error_response('Route not found'));
