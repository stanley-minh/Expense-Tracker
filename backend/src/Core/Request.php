<?php

namespace App\Core;

/**
 * Reads data sent by the client.
 */
final class Request
{
    /**
     * Decodes the JSON body of the request (POST / PUT).
     *
     * $_POST cannot be used here: PHP only fills it for HTML form encodings,
     * not for JSON. The raw body is read from the php://input stream instead.
     *
     * @return array<string, mixed>|null The decoded object, or null when the body
     *                                    is empty, malformed, or not a JSON object
     */
    public static function json(): ?array
    {
        $raw = file_get_contents('php://input');

        try {
            $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null; // malformed JSON
        }

        // A JSON object decodes to an associative array.
        // A list ([1, 2]) or a scalar ("text", 42) is not a valid body here.
        if (!is_array($data) || array_is_list($data)) {
            return null;
        }

        return $data;
    }
}
