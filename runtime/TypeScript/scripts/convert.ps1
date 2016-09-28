$keywords = echo return, else, yeild

function TSType( [string]$javaType ) {
    switch ($javaType) {
        "String" { "string" }
        "Int" { "number" }
        default { $_ }
    }
}

function TSParams( [string]$javaParams ) {
    $params = $javaParams -split ','
    for ($i=0; $i-lt $params.Length; $i++) {
       $params[$i] = $params[$i] -replace '\s*(@\w+\s+)*(\w+)\s+(\w+)\s*', '$1${3}: $2'
    }
    return $params -join ', '
}

function ConvertTo-TS {
    param( 
        [parameter(Mandatory=$true,ValueFromPipeline=$true)]
        [string[]] $path )
        process {
        foreach ($p in $path) {
            $content = get-content $p 
            $content = switch -Regex ($content) {
                "^package .*" { "// $_" }
                "^import org\.antlr\.v4\.runtime\.(.*?)\.(.*?);" { "import { $($matches[2]) } from './$($matches[1])/index';" }
                "^public (.*)" { "export $($matches[1])" }

                "^(\s+(?:public|protected|private)\s+)(\w+)\s(\w+)\((.+)\)" {
                    "$($matches[1])$($matches[3])($(TSParams $matches[4])): $(TSType $matches[2])"
                    }  
                "^(\s+)(\w+)\s(\w+)\s*(=|;)(.*)" {
                    if ($matches[2] -in $keywords) { $_ } else {
                        "$($matches[1])const $($matches[3]): $(TSType $Matches[2]) $($matches[4])$($matches[5])"
                        }
                    } 
                          
                default  {
                    $_
                } 
            }

            $content
        }
    }
}

ConvertTo-TS  ..\src\DefaultErrorStrategy.ts