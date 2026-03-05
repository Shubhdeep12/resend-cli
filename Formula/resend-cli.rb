# typed: false
# frozen_string_literal: true

class ResendCli < Formula
  desc "CLI for Resend (resend.com)"
  homepage "https://github.com/Shubhdeep12/resend-cli"
  url "https://registry.npmjs.org/@shubhdeep12/resend-cli/-/resend-cli-0.4.15.tgz"
  sha256 "bf6f6214c6718ec4b6e058b3d53ffe48a744c317db3559126b79869efc0a2391"
  license "MIT"

  depends_on "node"

  def install
    (buildpath/"package").cd do
      system "npm", "install", *Language::Node.std_npm_args(libexec)
    end
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "resend", shell_output("#{bin}/resend --help")
  end
end
