<?php

namespace App\Core;

use RuntimeException;

/**
 * An error that must be sent to the client with a given HTTP status.
 *
 * Thrown anywhere (e.g. Auth::requireUserId() when nobody is logged in) and
 * caught once in public/index.php, which turns it into a JSON response.
 * This avoids repeating "send 401 then return" in every controller method.
 */
final class HttpException extends RuntimeException
{
    private int $status;

    /**
     * @param int    $status  HTTP status code (401, 403, 404...)
     * @param string $message Message shown to the user (in French)
     */
    public function __construct(int $status, string $message)
    {
        parent::__construct($message);
        $this->status = $status;
    }

    public function getStatus(): int
    {
        return $this->status;
    }
}
