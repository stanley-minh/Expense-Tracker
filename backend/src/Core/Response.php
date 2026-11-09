<?php

namespace App\Core;

/**
 * Sends JSON responses: the "View" layer of this API.
 *
 * React takes care of the visual rendering; the backend only returns data.
 * Centralizing this means a header added later (CORS, security...) is
 * written in one single place.
 */
final class Response
{
    /**
     * Sends data as JSON with an HTTP status code.
     *
     * @param mixed $data   Data to serialize (array, scalar, null...)
     * @param int   $status HTTP status code (200, 201, 404, 500...)
     */
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}
